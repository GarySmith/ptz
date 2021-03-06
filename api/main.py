from flask import Flask, jsonify, send_from_directory, request, abort, \
    current_app
import datetime
import logging
import logging.handlers
import os
import redis
import shutil
import time

from api.auth import needs_admin, needs_user, create_token, get_token_payload
from api import camera
from api import network
from api import system
from api import vlc

LOG_FILENAME = 'ptz.log'

handler = logging.handlers.RotatingFileHandler(LOG_FILENAME,
                                               maxBytes=1024*1024,
                                               backupCount=5)

logging.basicConfig(
        format='%(asctime)s %(levelname)s %(message)s',
        level=logging.INFO,
        handlers=[handler])

LOG = logging.getLogger(__name__)

# werkzeug is not present in production, so do not rely on having its logs
# in development
logging.getLogger('werkzeug').setLevel(logging.WARN)

app = Flask(__name__,
            static_url_path='',
            static_folder='web')
app.logger
app.logger.handlers = []
app.logger.propagate = True

r = redis.Redis(decode_responses=True)
# The data is structured in redis as follows:
# 'vlc' and 'camera' are standard redis hashes -- use hgetall to view all
#    key/value pairs
# Since redis does not support arrays of hashes, 'accounts' and 'presets'
# are represented by a set of keys and a corresponding hash for each. For
# example, the set named 'presets' (viewed with smembers presets' contains
# the values preset:1, preset:2, etc., and for each such value, there is
# a hash with that name, e.g. hgetall preset:1
#

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


@app.after_request
def log_request(resp):
    LOG.info("%s %s %d", request.method, request.path, resp.status_code)
    return resp


def get_presets():
    result = []
    for preset in r.smembers('presets'):
        info = r.hgetall(preset)
        for key in ('num', 'pan', 'tilt', 'zoom'):
            if key in info:
                info[key] = int(info[key])

        result.append(info)
    return sorted(result, key=lambda x : x['num'])


def get_accounts():
    result = []
    for account in r.smembers('accounts'):
        info = r.hgetall(account)
        info['admin'] = to_bool(info.get('admin'))
        result.append(info)

    return result


def get_account(username):
    key = account_key(username)

    if r.sismember('accounts', key):
        info = r.hgetall(key)
        info['admin'] = to_bool(info.get('admin'))

        return info


def account_key(name):
    return 'account:%s' % name

def to_bool(val):
    if not val:
        return False

    return val.lower() == 'true'

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
    return jsonify(get_presets())


def get_camera_settings():

    ip_address, ptz_port = r.hmget('camera', 'ip_address', 'ptz_port')
    return {
        'ip_address': ip_address or DEFAULT_IP_ADDRESS,
        'ptz_port': int(ptz_port) or DEFAULT_PTZ_PORT
    }


def get_vlc_settings():

    result = {
        'address': '192.168.1.2',
        'rc_port': 4200,
        'user': 'gary',
        'snapshot_dir': 'scans',
        'video_dir': 'Videos',
    }

    vlc = r.hgetall('vlc')
    if vlc:
        if 'rc_port' in vlc:
            vlc['rc_port'] = int(vlc['rc_port'])
        result.update(vlc)

    return result


@app.route("/api/current_preset", methods=['POST'])
@needs_user()
def change_current_preset():
    """
    Calls the camera to recall the given preset
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

    start_time = time.time()
    last_position = {}
    position = camera.get_position(camera_settings['ip_address'],
                                   camera_settings['ptz_port'])

    presets = get_presets()
    # Continue looping if the camera is moving and it is not at a known preset
    while last_position != position and time.time() - start_time < 7:

        for preset in presets:
            if (preset['zoom'] == position['zoom'] and
                preset['pan'] == position['pan'] and
                preset['tilt'] == position['tilt']):

                return jsonify({'current_preset': preset['num']})

        # There is no direct match, so search for one that is close.  Each
        # field is represented as a 2-byte unsigned integer, so that its
        # value potentially ranges from 0 to 65536, but it appears that some
        # values, especially pan, only appear in a small portion of this range.
        # Therefore, consider a "close" value to be within +/= 5 of its target.
        for preset in presets:
            if preset['zoom']-5 <= position['zoom'] <= preset['zoom']+5 and \
               preset['pan']-5 <= position['pan'] <= preset['pan']+5 and \
               preset['tilt']-5 <= position['tilt'] <= preset['tilt']+5:

                return jsonify({'current_preset': preset['num']})

        # If the camera are not near a known preset, see whether it is actively
        # moving.  If so, give it a little time to settle down.
        last_position = position
        time.sleep(0.1)
        position = camera.get_position(camera_settings['ip_address'],
                                       camera_settings['ptz_port'])

    return jsonify({'current_preset': -1})


# Important: In production, the web server should be configured to serve image
# files directly rather than calling this service.  For example, nginx can
# handle this with the configuration:
#   location /images/ {
#      root /home/pi/ptz/public;
#      try_files $uri /images/other.jpg =404;
#   }


@app.route("/images/<path:name>", methods=['GET'])
def get_image_file(name):

    dir = os.path.normpath(os.path.join(os.getcwd(), 'public', 'images'))
    if (os.path.isfile(os.path.join(dir, name))):
        return send_from_directory(dir, name)
    else:
        return send_from_directory(dir, 'other.jpg')


@app.route("/api/login", methods=['POST'])
def login():

    info = request.get_json()
    username = info.get('username')
    password = info.get('password')

    acct = get_account(username)
    if acct is None:
        abort(401, 'Invalid credentials')

    if acct['password'] == password:
        is_admin = acct['admin']
        display_name = acct['display_name']
        exp_time = time.time() + \
            datetime.timedelta(days=365).total_seconds()
        token = create_token(username, display_name, is_admin, exp_time)
        response = jsonify({
            'display_name': display_name,
            'admin': is_admin,
            'token': token,
        })
        response.set_cookie('token', value=token, expires=exp_time)
        return response


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

    acct = get_account(user)
    if acct is None:
        abort(401, 'Invalid user')

    key = account_key(user)
    r.hset(key, 'password', new_pass)
    return jsonify('Success')


@app.route("/api/users/<user>", methods=['DELETE'])
@needs_admin()
def delete_user(user):

    token = request.cookies.get('token')
    payload = get_token_payload(token)
    if payload['user'] == user:
        abort(422, 'Cannot delete yourself')

    acct = get_account(user)
    if acct is None:
        abort(401, 'Invalid user')

    key = account_key(user)
    items = r.hkeys(key)
    r.hdel(*items)
    r.srem('accounts', key)

    return jsonify('Success')


@app.route("/api/users", methods=['GET'])
@needs_admin()
def get_all_users():

    results = []
    accounts = get_accounts()
    for account in accounts:
        results.append({k: v for k, v in account.items() if k != 'password'})
    return jsonify(results)


@app.route("/api/users/<user>", methods=['GET'])
@needs_admin()
def get_user(user):

    acct = get_account(user)
    if acct is None:
        abort(401, 'Invalid user')

    del acct['password']
    return jsonify(acct)


@app.route("/api/users", methods=['POST'])
@needs_admin()
def create_user():

    info = request.get_json()
    username = info['username']

    acct = get_account(username)
    if acct is not None:
        abort(401, 'User already exists')

    user_info = {
        'username': username,
        'password': info['password'],
        'admin': info.get('admin','').lower(),
        'display_name': info.get('display_name', ''),
        'session_duration': '1',
    }

    key = account_key(username)
    r.hmset(key, user_info)
    r.sadd('accounts', key)

    return jsonify('Success')


# admin can change a user's display_name, password, session duration, and role
@app.route("/api/users/<user>/settings", methods=['POST'])
@needs_admin()
def change_setting(user):
    acct = get_account(user)
    if acct is None:
        abort(401, 'Invalid user')

    info = request.get_json()

    key = account_key(user)
    for field in ('password', 'display_name', 'session_duration'):
        if field in info:
            r.hset(key, field, info[field])
    if 'admin' in info:
        r.hset(key, 'admin', info['admin'].lower())

    return jsonify('Success')


# user can change a user's display_name and password
@app.route("/api/users/settings", methods=['POST'])
@needs_user()
def change_my_setting():
    token = request.cookies.get('token')
    payload = get_token_payload(token)
    user = payload['user']

    acct = get_account(user)
    if acct is None:
        abort(401, 'Invalid user')

    info = request.get_json()

    key = account_key(user)
    for field in ('password', 'display_name'):
        if field in info:
            r.hset(key, field, info[field])

    return jsonify('Success')


@app.route("/api/camera", methods=['GET'])
@needs_admin()
def get_camera():

    return jsonify(get_camera_settings())


@app.route("/api/camera", methods=['POST'])
@needs_admin()
def update_camera_settings():

    info = request.get_json()

    ip_address = info['ip_address']
    ptz_port = int(info['ptz_port'])

    if not network.test_connection(ip_address, ptz_port):
        abort(422, 'Unable to connect')

    r.hmset('camera', {
        'ip_address': ip_address,
        'ptz_port': ptz_port
    })
    return jsonify("Success")


@app.route("/api/vlc", methods=['GET'])
@needs_admin()
def get_vlc():

    return jsonify(get_vlc_settings())


@app.route("/api/vlc", methods=['POST'])
@needs_admin()
def update_vlc_settings():

    info = request.get_json()

    address = info['address']
    rc_port = int(info['rc_port'])
    user = info['user']
    snapshot_dir = info['snapshot_dir']
    video_dir = info['video_dir']

    if not network.test_connection(address, rc_port):
        abort(422, 'Unable to connect to RC port')

    try:
        network.test_sftp_connection(address, user, snapshot_dir, video_dir)
    except Exception as e:
        abort(422, str(e))

    r.hmset('vlc', {
        'address': address,
        'rc_port': rc_port,
        'user': user,
        'snapshot_dir': snapshot_dir,
        'video_dir': video_dir,
    })
    return jsonify("Success")


@app.route("/api/vlc/is_playing", methods=['GET'])
def is_playing():

    vlc_settings = get_vlc_settings()

    return jsonify(vlc.is_playing(vlc_settings['address'],
                                  vlc_settings['rc_port']))


@app.route("/api/vlc/is_recording", methods=['GET'])
def is_recording():

    vlc_settings = get_vlc_settings()

    if not vlc.is_playing(vlc_settings['address'],
                          vlc_settings['rc_port']):
        return jsonify(False)

    recording = system.is_video_capturing(vlc_settings['address'],
                                          vlc_settings['user'],
                                          vlc_settings['video_dir'])
    return jsonify(recording)


@app.route("/api/vlc/snapshot", methods=['GET'])
def take_snapshot():

    vlc_settings = get_vlc_settings()

    try:
        name = system.take_snapshot(vlc_settings['address'],
                                    vlc_settings['rc_port'],
                                    vlc_settings['user'],
                                    vlc_settings['snapshot_dir'])

        # In order to avoid cluttering up /tmp with snapshots, remove
        # the file after it is streamed.  As suggested in
        # https://stackoverflow.com/a/40854330 , a generator is used to
        # supply the contents of the file and then delete it afterward

        def generate():
            with open(name, "rb") as f:
                yield from f
            os.remove(name)

        return current_app.response_class(generate(), mimetype='image/jpeg')

    except Exception as e:
        abort(500, str(e))


@app.route("/api/preset/<int:preset>", methods=['POST'])
@needs_admin()
def change_preset(preset):
    """
    Update the given preset to the current camera position, and optionally
    update the snapshot
    """
    if preset < 0 or preset > 255:
        abort(406, "Invalid preset")

    camera_settings = get_camera_settings()

    position = camera.get_position(camera_settings['ip_address'],
                                   camera_settings['ptz_port'])


    key = 'preset:{0}' % preset
    r.hmset(key, {
        'num': preset,
        'image_url': '/images/{0}.jpg'.format(preset),
        'zoom': position['zoom'],
        'pan': position['pan'],
        'tilt': position['tilt']})
    r.sadd('presets', key)

    return jsonify("Success")


@app.route("/api/vlc/snapshot/<int:preset>", methods=['POST'])
@needs_admin()
def update_preset_snapshot(preset):

    vlc_settings = get_vlc_settings()

    try:
        name = system.take_snapshot(vlc_settings['address'],
                                    vlc_settings['rc_port'],
                                    vlc_settings['user'],
                                    vlc_settings['snapshot_dir'])
        shutil.move(name, 'public/images/{0}.jpg'.format(preset))
        return jsonify("Success")

    except Exception as e:
        abort(500, str(e))


@app.route("/api/vlc/keypress/<string:keyname>", methods=['POST'])
@needs_admin()
def send_keypress(keyname):

    vlc_settings = get_vlc_settings()

    if not vlc.is_playing(vlc_settings['address'],
                          vlc_settings['rc_port']):
        abort(422, 'VLC is not ready to record')

    try:
        if not keyname.startswith('key-'):
            keyname = 'key-' + keyname
        vlc.send_keypress(vlc_settings['address'],
                          vlc_settings['rc_port'],
                          keyname)
        return jsonify('Success')

    except Exception as e:
        abort(500, str(e))
