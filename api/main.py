from flask import Flask, jsonify, send_from_directory, request, abort
from time import sleep
import json
import os
app = Flask(__name__)

from api import camera

# Default setting used by the PTZ camera
DEFAULT_IP_ADDRESS = "192.168.100.88"
DEFAULT_PTZ_PORT = 5678

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
    return jsonify(get_settings('presets') or [])


@app.route("/api/presets/<preset>", methods=['POST'])
def update_preset_image(preset):

    # Get the payload from the image.  This might be better handled by
    #    nginx/apache
    return jsonify("Success")


@app.route("/api/current_preset", methods=['POST'])
def change_current_preset():
    """
    Calls the camera to recall the current preset
    """
    payload = request.get_json()
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

    presets = get_settings('presets') or []

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
def calibrate():
    """
    Manipulates the camera to move to each preset and capture the
    coordinates of that position, storing them away for future reference
    """
    # sleep(1)  # Emulate some elapsed time
    info = {}
    if request.content_length:
        info = request.get_json()

    max_presets = info.get('max_presets', int(3))

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

    save_settings(presets, 'presets')

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

    accounts = get_settings('accounts') or []
    for account in accounts:
        if account['username'] == username and account['password'] == password:
            return jsonify({
                'display_name': account['display_name'],
                'admin': account['admin']
            })
    else:
        abort(401, 'Invalid credentidals')


def get_settings(section=None):
    settings = {}

    try:
        with open("settings.json") as f:
            settings = json.load(f)

    except IOError:
        pass

    if (section):
        return settings.get(section)

    return settings

def save_settings(settings, section=None):

    if (section):
        new_settings = get_settings()
        new_settings[section] = settings
    else:
        new_settings = settings

    try:
        with open("settings.json",  'w') as f:
            json.dump(new_settings, f)
    except:
        pass

    return jsonify("Success")


@app.route("/api/camera", methods=['GET'])
def get_camera():
    return jsonify(get_camera_settings())


@app.route("/api/camera", methods=['POST'])
def update_camera_settings():

    info = request.get_json()

    camera_settings = get_camera_settings()
    camera_settings['ip_address'] = info['ip_address']
    camera_settings['ptz_port'] = int(info['ptz_port'])

    if not camera.test_connection(camera_settings['ip_address'],
                                  camera_settings['ptz_port']):
        abort(401, 'Invalid host, port combination')

    save_settings(camera_settings, 'camera')
    return jsonify("Success")


def get_camera_settings():

    camera_settings = get_settings('camera') or {}
    if 'ip_address' not in camera_settings:
        camera_settings['ip_address'] = DEFAULT_IP_ADDRESS

    if 'ptz_port' not in camera_settings:
        camera_settings['ptz_port'] = DEFAULT_PTZ_PORT

    return camera_settings


# TODO(gary) Need apis for:
#   Uploading an image for a given preset

@app.route("/api/position", methods=['GET'])
def get_position():

    camera_settings = get_camera_settings()

    position = camera.get_position(camera_settings['ip_address'],
                                   camera_settings['ptz_port'])

    # Do some math to figure out which is the closest known preset

    return jsonify(position)
