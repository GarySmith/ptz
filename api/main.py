from flask import Flask, jsonify, send_from_directory, request, abort
from functools import wraps
from jose import jwt
from time import sleep
import json
import os
import time
app = Flask(__name__)

from api import camera
from api import settings

# Default setting used by the PTZ camera
DEFAULT_IP_ADDRESS = "192.168.100.88"
DEFAULT_PTZ_PORT = 5678

def needs_user():
    """
    Decorator to require that a valid user token be included with the cookies
    in the request
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            token = request.cookies.get('token')
            if not token:
                abort(401, "Not logged in")
            if not get_token_payload(token):
                abort(401, "Invalid token supplied")
            return func(*args, **kwargs)
        return wrapper

    return decorator

def needs_admin():
    """
    Decorator to require that a valid user token with admin priviledges to
    be included with the cookies in the request
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            token = request.cookies.get('token')
            if not token:
                abort(401, "Not logged in")
            token_payload = get_token_payload(token)
            if not token_payload:
                abort(401, "Invalid token supplied")
            if not token_payload.get('admin'):
                abort(403, "User must be an admin")

            return func(*args, **kwargs)
        return wrapper

    return decorator


@app.route("/api/presets")
def get_all_presets():
    """
    Returns a json array, and each element of the array is on object with
    the values:
        num:  preset number (0-255)
        image_url: URL of the image, relative to this host

    Note:
        The camera supports a maximum of 255 presets
    """
    return jsonify(settings.get_settings('presets') or [])


@app.route("/api/presets/<preset>", methods=['POST'])
@needs_admin()
def update_preset_image(preset):

    # Get the payload from the image.  This might be better handled by
    #    nginx/apache
    return jsonify("Success")


@app.route("/api/current_preset", methods=['POST'])
@needs_user()
def change_current_preset():
    """
    Calls the camera to recall the current preset
    """
    payload = request.get_json()
    preset = int(payload.get('current_preset', 0))
    if preset < 0 or preset > 255:
        abort(406, "Invalid preset")

    camera_settings = settings.get_camera_settings()

    camera.recall_preset(camera_settings['ip_address'],
                         camera_settings['ptz_port'],
                         preset)

    return jsonify("Success")


@app.route("/api/current_preset", methods=['GET'])
def get_current_preset():
    """
    Obtains the current coordinates from the camera and returns the
    corresponding preset.  Returns -1 if the current coordinates do not
    correspond to any preset
    """
    camera_settings = settings.get_camera_settings()

    position = camera.get_position(camera_settings['ip_address'],
                                   camera_settings['ptz_port'])

    presets = settings.get_settings('presets') or []

    for preset in presets:
        if position['zoom'] == preset['zoom'] and \
           position['focus'] == preset['focus'] and \
           position['pan'] == preset['pan'] and \
           position['tilt'] == preset['tilt']:
            return jsonify({'current_preset': preset['num']})
    else:
        return jsonify({'current_preset': -1})


    # TODO(gary): Add extra logic to permit the value to be close to, but
    # not exactly that corresponding to a preset


@app.route("/api/calibrate", methods=['POST'])
@needs_admin()
def calibrate():
    """
    Manipulates the camera to move to each preset and capture the
    coordinates of that position, storing them away for future reference
    """
    # sleep(1)  # Emulate some elapsed time
    info = {}
    if request.content_length:
        info = request.get_json()

    max_presets = int(info.get('max_presets', 3))
    if max_presets < 1 or max_presets > 255:
        abort(406, "Invalid number or presets")

    presets = []
    # Create a new, ordered, empty sets of presets
    for num in range(1, max_presets+1):
        presets.append({'num': num,
                        'image_url': '/images/{0}.jpg'.format(num) })

    camera_settings = settings.get_camera_settings()
    ip = camera_settings['ip_address']
    port = camera_settings['ptz_port']

    for preset in presets:
        camera.recall_preset(ip, port, preset['num'])
        position = camera.get_position(ip, port)
        preset.update(position)

    settings.save_settings(presets, 'presets')

    return jsonify("Success")

# TODO(gary): Configure apache/nginx to enable uploading and downloading files
#             directly rather than relying on flask for this.
@app.route("/images/<path:name>", methods=['GET'])
def get_image_file(name):

    dir = os.path.normpath(os.path.join( os.getcwd(), 'public', 'images'))
    return send_from_directory(dir, name)


@app.route("/api/login", methods=['POST'])
def login():
    info = request.get_json()
    username = info.get('username')
    password = info.get('password')

    accounts = settings.get_settings('accounts') or []
    for account in accounts:
        if account['username'] == username:
            if account['password'] == password:
                is_admin = account['admin']
                token = get_token(username, is_admin)
                response = jsonify({
                    'display_name': account['display_name'],
                    'admin': is_admin,
                    'token': token,
                })
                response.set_cookie('token', value=token)
                return response

            break

    abort(401, 'Invalid credentidals')


@app.route("/api/camera", methods=['GET'])
@needs_admin()
def get_camera():
    return jsonify(settings.get_camera_settings())


@app.route("/api/camera", methods=['POST'])
@needs_admin()
def update_camera_settings():

    info = request.get_json()

    camera_settings = settings.get_camera_settings()
    camera_settings['ip_address'] = info['ip_address']
    camera_settings['ptz_port'] = int(info['ptz_port'])

    if not camera.test_connection(camera_settings['ip_address'],
                                  camera_settings['ptz_port']):
        abort(401, 'Invalid host, port combination')

    settings.save_settings(camera_settings, 'camera')
    return jsonify("Success")


SECRET = None
def get_secret():
    global SECRET
    if not SECRET:
        try:
            print("loading secret.txt")
            with open('secret.txt') as f:
                SECRET = f.readline()

        except IOError:

            import uuid
            SECRET = uuid.uuid4().hex
            try:
                print("Creating new secret.txt")
                with open('secret.txt','w') as f:
                    f.write(SECRET)

            except IOError:
                print('Unable to save secret file. All sessions will ' +
                        'become invalid when the service restarts')
                pass
    return SECRET


AUDIENCE = 'ptzapp'

@app.route("/api/token", methods=['POST'])
def validate_token():
    payload = request.get_json()
    if not get_token_payload(payload['token']):
        abort(401)

    return jsonify("Success")


def get_token_payload(token):
    try:
        return jwt.decode(token, get_secret(), audience=AUDIENCE)
    except Exception as e:
        print("Token invalid: ", e)


def get_token(user, admin=False):
    payload = {
        'user': user,
        'admin': admin,
        'aud': AUDIENCE,
        # 'exp': int(time.time()) + 30,  # for testing expirate times
    }
    return jwt.encode(payload, get_secret(), algorithm='HS256')




# TODO(gary) Need apis for:
#   Uploading an image for a given preset
#   Power on/off camera
#   Other settings (eventually)
