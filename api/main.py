from flask import Flask, jsonify, send_from_directory, request, abort
from functools import wraps
import os
import time
from tinydb import TinyDB, Query

app = Flask(__name__)

from api.auth import needs_admin, needs_user, create_token, get_token_payload
from api import camera

DB = TinyDB('settings.json')

# Default setting used by the PTZ camera
DEFAULT_IP_ADDRESS = "192.168.100.88"
DEFAULT_PTZ_PORT = 5678

# Create an error handler that returns json
@app.errorhandler(401)
@app.errorhandler(403)
@app.errorhandler(404)
@app.errorhandler(406)
@app.errorhandler(422)
@app.errorhandler(500)
def json_errors(error):
    response = jsonify({'code': error.code, 'description': error.description})
    response.status_code = error.code
    return response


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
    return jsonify(DB.table('presets').all())


def get_camera_settings():

    camera = DB.table('camera')
    settings = camera.all()
    if (len(settings) < 1):
        camera.insert({'ip_address': DEFAULT_IP_ADDRESS,
                       'ptz_port': DEFAULT_PTZ_PORT})

    return settings[0]


@app.route("/api/current_preset", methods=['POST'])
@needs_user()
def change_current_preset():
    """
    Calls the camera to recall the current preset
    """
    payload = request.get_json()
    if 'current_preset' not in payload:
        abort(406, "current_preset missing from request")

    preset = int(payload.get('current_preset', 0))
    if preset < 0 or preset > 255:
        abort(406, "Invalid preset")

    camera_settings = get_camera_settings()

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
    camera_settings = get_camera_settings()

    position = camera.get_position(camera_settings['ip_address'],
                                   camera_settings['ptz_port'])

    presets = DB.table('presets')
    Preset = Query()
    match = presets.search((Preset.zoom == position['zoom']) &
                           (Preset.pan == position['pan']) &
                           (Preset.tilt == position['tilt']))

    if (len(match) > 0):
        return jsonify({'current_preset': match[0]['num']})

    # There is no direct match, so search for one that is close.  Each
    # field is represented as a 2-byte unsigned integer, so that its
    # value potentially ranges from 0 to 65536, but it appears that some
    # values, especially pan, only appear in a small portion of this range.
    # Therefore, consider a "close" value to be within +/= 5 of its target.
    for preset in presets.all():
        if preset['zoom'] - 5 <= position['zoom'] <= preset['zoom'] + 5 and \
           preset['pan'] - 5 <= position['pan'] <= preset['pan'] + 5 and \
           preset['tilt'] - 5 <= position['tilt'] <= preset['tilt'] + 5:

            return jsonify({'current_preset': preset['num']})

    return jsonify({'current_preset': -1})


@app.route("/api/calibrate", methods=['POST'])
@needs_admin()
def calibrate():
    """
    Manipulates the camera to move to each preset and capture the
    coordinates of that position, storing them away for future reference
    """
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

    camera_settings = get_camera_settings()
    ip = camera_settings['ip_address']
    port = camera_settings['ptz_port']

    for preset in presets:
        camera.recall_preset(ip, port, preset['num'])
        position = camera.get_position(ip, port)
        preset.update(position)

    preset_tbl = DB.table('presets')
    preset_tbl.purge()
    preset_tbl.insert_multiple(presets)

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

    accounts = DB.table('accounts')
    User = Query()
    accts = accounts.search(User.username == username)
    if len(accts) == 1:
        acct = accts[0]
        if acct['password'] == password:
            is_admin = acct['admin']
            display_name = acct['display_name']
            token = create_token(username, display_name, is_admin)
            response = jsonify({
                'display_name': display_name,
                'admin': is_admin,
                'token': token,
            })
            response.set_cookie('token', value=token)
            return response

    abort(401, 'Invalid credentials')


@app.route("/api/users/<user>/password", methods=['POST'])
@needs_admin()
def change_password(user):
    info = request.get_json()
    password = info.get('password')
    return update_password(user, password)


@app.route("/api/password", methods=['POST'])
@needs_user()
def change_my_password():

    info = request.get_json()
    password = info.get('password')

    # Get username from the token
    token = request.cookies.get('token')
    payload = get_token_payload(token)
    return update_password(payload['user'], password)


def update_password(user, new_pass):

    accounts = DB.table('accounts')
    User = Query()
    if not accounts.search(User.username == user):
        abort(401, 'Invalid user')

    accounts.update({'password': new_pass}, User.username == user)
    return jsonify('Success')


@app.route("/api/users/<user>", methods=['DELETE'])
@needs_admin()
def delete_user(user):

    token = request.cookies.get('token')
    payload = get_token_payload(token)
    if payload['user'] == user:
        abort(422, 'Cannot delete yourself')

    accounts = DB.table('accounts')
    User = Query()
    if not accounts.search(User.username == user):
        abort(401, 'Invalid user')

    accounts.remove(User.username == user)
    return jsonify('Success')


@app.route("/api/users", methods=['GET'])
@needs_admin()
def get_all_users():

    accounts = DB.table('accounts')
    User = Query()
    all_users = [user['username'] for user in accounts.all()]
    return jsonify(all_users)


@app.route("/api/users/<user>", methods=['GET'])
@needs_admin()
def get_user(user):

    accounts = DB.table('accounts')
    User = Query()
    if not accounts.search(User.username == user):
        abort(401, 'Invalid user')

    return jsonify(accounts.search(User.username == user))


@app.route("/api/users", methods=['POST'])
@needs_admin()
def create_user():

    info = request.get_json()

    username = info['username']
    accounts = DB.table('accounts')
    User = Query()
    if accounts.search(User.username == username):
        abort(401, 'User already exists')

    user = {
        'username': username,
        'password': info['password'],
        'admin': info.get('admin') in ('true', True),
        'display_name': info.get('display_name', ''),
    }
    accounts.insert(user)
    return jsonify('Success')


@app.route("/api/camera", methods=['GET'])
@needs_admin()
def get_camera():

    return jsonify(get_camera_settings())


@app.route("/api/camera", methods=['POST'])
@needs_admin()
def update_camera_settings():

    info = request.get_json()

    # camera_settings = get_camera_settings()
    ip_address = info['ip_address']
    ptz_port = int(info['ptz_port'])

    if not camera.test_connection(ip_address, ptz_port):
        abort(422, 'Invalid host, port combination')

    get_camera_settings()
    camera_settings = DB.table('camera')
    camera_settings.update({
        'ip_address': ip_address,
        'ptz_port': ptz_port})
    return jsonify("Success")


# TODO(gary) Need apis for:
#   Uploading an image for a given preset
#   Power on/off camera
#   Other settings (eventually)
