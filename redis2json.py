#!/usr/bin/python3

import json
import redis

r = redis.Redis(decode_responses=True)

result = {
    'presets': [],
    'accounts': []
}

for preset in r.smembers('presets'):
    info = r.hgetall(preset)
    for key in ('num', 'pan', 'tilt', 'zoom'):
        if key in info:
            info[key] = int(info[key])
    result['presets'].append(info)

for account in r.smembers('accounts'):
    info = r.hgetall(account)
    if 'admin' in info:
        info['admin'] = info['admin'].lower() == "true"
    result['accounts'].append(info)

vlc = r.hgetall('vlc')
vlc['rc_port'] = int(vlc['rc_port'])
result['vlc'] = vlc

camera = r.hgetall('camera')
camera['ptz_port'] = int(camera['ptz_port'])
result['camera'] = camera

print (json.dumps(result))
