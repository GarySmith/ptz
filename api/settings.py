import json

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


def get_camera_settings():
    camera_settings = get_settings('camera') or {}
    if 'ip_address' not in camera_settings:
        camera_settings['ip_address'] = DEFAULT_IP_ADDRESS

    if 'ptz_port' not in camera_settings:
        camera_settings['ptz_port'] = DEFAULT_PTZ_PORT

    return camera_settings
