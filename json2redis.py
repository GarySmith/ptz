#!/usr/bin/python3

import json
import pdb
import redis
import sys


if len(sys.argv) < 2:
    print("Usage: json2redis.py JSONFILE")
    sys.exit(-1)

r = redis.Redis(decode_responses=True)

# Need a script to convert from tinydb to "normal" json

def hdelall(hash):
    keys = r.hkeys(hash)
    if keys:
        r.hdel(*keys)

with open(sys.argv[1]) as f:
    payload = json.load(f)

    # Remove the existing entries
    for t in ('vlc', 'camera'):
        hdelall(t)
    for t in ('presets', 'accounts'):
        for item in r.smembers(t):
            r.srem(t, item)
            hdelall(item)

    # Populate with new values
    for t in ('vlc', 'camera'):
        r.hmset(t, payload.get(t))

    for item in payload.get('presets', []):
        key = "preset:%s" % item['num']
        for k,v in item.items():
            r.hset(key, k, str(v))
        r.sadd('presets', key)

    for item in payload.get('accounts', []):
        key = "account:%s" % item['username']
        for k,v in item.items():
            r.hset(key, k, str(v))
        r.sadd('accounts', key)
