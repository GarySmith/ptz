from flask import Flask, jsonify, send_from_directory, request, abort
from time import sleep
import json
import os
app = Flask(__name__)

@app.route("/api/presets")
def get_all_presets():
    """
    Returns a json array, such as:
        [{
            "num": 1,
            "image_url": "/images/1.jpg",
         },
         {
            "num": 2,
            "image_url": "/images/2.jpg",
         },
         {
            "num": 3,
            "image_url": "/images/3.jpg",
         }
        ]

    Note:
        The camera supports a maximum of 255 presets

    Preset 0 is supported, and will be used as the default if set.

    """
    settings = get_settings()
    return jsonify(settings.get('presets', []))


@app.route("/api/presets/<preset>", methods=['POST'])
def update_preset_image(preset):

    # Get the payload from the image.  This might be better handled by
    #    nginx/apache
    return jsonify("Success")


current_preset = 1

@app.route("/api/current_preset", methods=['POST'])
def change_current_preset():
    """
    Calls the camera to recall the current preset
    """
    sleep(0.5)

    payload = request.get_json() or {}
    preset = int(payload.get('current_preset', 0))
    if preset < 0 or preset > 255:
        abort(406, "Invalid preset")

    # TODO(gary): Call the camera here
    global current_preset
    current_preset = preset

    return jsonify("Success")


@app.route("/api/current_preset", methods=['GET'])
def get_current_preset():
    """
    Obtains the current coordinates from the camera and returns the
    corresponding preset.  Returns -1 if the current coordinates do not
    correspond to any preset
    """

    # TODO(gary): Call the camera here
    return jsonify({'current_preset': current_preset});


@app.route("/api/calibrate", methods=['POST'])
def calibrate():
    """
    Manipulates the camera to move to each preset and capture the
    coordinates of that position, storing them away for future reference
    """
    sleep(1)  # Emulate some elapsed time
    settings = get_settings()

    # TODO(gary): Obtain this from the camera
    settings['presets']  = [{
        'num': 1,
        'image_url': '/images/1.jpg'
    },{
        'num': 2,
        'image_url': '/images/2.jpg'
    },{
        'num': 3,
        'image_url': '/images/3.jpg'
    }]
    save_settings(settings)

    return jsonify("Success")

# TODO(gary): Configure apache/nginx to enable uploading and downloading files
#             directly rather than relying on flask for this.
@app.route("/images/<path:name>", methods=['GET'])
def get_image_file(name):

    dir = os.path.normpath(os.path.join( os.getcwd(), 'public', 'images'))
    return send_from_directory(dir, name)


@app.route("/api/login", methods=['POST'])
def login():
    info = request.get_json() or {}
    username = info.get('username')
    password = info.get('password')

    accounts = get_settings().get('accounts', [])
    for account in accounts:
        if account['username'] == username and account['password'] == password:
            return jsonify({
                'display_name': account['display_name'],
                'admin': account['admin']
            })
    else:
        abort(401, 'Invalid credentidals')


def get_settings():
    settings = {}

    try:
        with open("settings.json") as f:
            settings = json.load(f)

    except IOError:
        pass

    return settings

def save_settings(settings):

    try:
        with open("settings.json",  'w') as f:
            json.dump(settings, f)
    except:
        pass

    return jsonify("Success")

# TODO(gary) Need apis for:
#   Uploading an image for a given preset
#   Setting the image url for a given preset
#   getting, updating the IP address of the camera
