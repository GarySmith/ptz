from flask import Flask, jsonify, send_from_directory
from time import sleep
import os
app = Flask(__name__)

@app.route("/api/presets")
def get_all_presets():
    """
    Returns a json array:
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
    presets = [{
        "num": 1,
        "image_url": "/images/1.jpg",
    },{
        "num": 2,
        "image_url": "/images/2.jpg",
    }]
    return jsonify(presets)

@app.route("/api/preset")
def get_current_presets():
    """
    Obtains the current coordinates from the camera and returns the
    corresponding preset.  Returns -1 if the current coordinates do not
    correspond to any preset
    """
    return jsonify(1);


@app.route("/api/calibrate", methods=['POST'])
def calibrate():
    """
    Manipulates the camera to move to each preset and capture the
    coordinates of that position, storing them away for future reference
    """
    sleep(1)  # Emulate some elapsed time
    return jsonify("Success")

# TODO(gary): Configure apache to enable uploading and downloading files
#             directly rather than relying on flask for this.
@app.route("/images/<path:name>", methods=['GET'])
def get_image_file(name):

    dir = os.path.normpath(os.path.join( os.getcwd(), 'public', 'images'))

    return send_from_directory(dir, name)


@app.route("/api/login", methods=['POST'])
def login():
    return jsonify("Success")

# Need apis for:
#   Uploading an image for a given preset
#   Setting the image url for a given preset
