#!/usr/bin/python3

import datetime
import os
import subprocess
import sys
import vimeo
import yaml

# Perform the normal wrapup tasks that are needed after the video recording
# has been completed including:
# - Rename the video to a human-friendly format
# - Extract the audio into a separate file into Dropbox
# - Upload the file to vimeo, with appropriate properties
# - Add the video to the Services channel in vimeo
# - Shutdown the laptop

# It is important that this script be idempotent, so that it can be run
# multiple times and only perform those steps that have not already been
# completed

RECORDINGS_DIR = os.path.join(os.path.expanduser('~'), 'Videos')
SERVICES_DIR = os.path.join(os.path.expanduser('~'), 'Dropbox', 'Services')

today = datetime.datetime.now().strftime('%Y-%m-%d')
video = os.path.join(RECORDINGS_DIR, today + '.mp4')

files = [os.path.join(RECORDINGS_DIR, f)
         for f in os.listdir(RECORDINGS_DIR) if today in f]

config = None
config_file = os.path.join(os.path.dirname(__file__), 'config.json')
try:
    with open(config_file) as f:
        config = yaml.safe_load(f)
except Exception as e:
    print('Unable to load config.json', e)
    sys.exit(1)

# Convert the filename from the cryptic version that VLC creates,
#   vlc-record-DATE-blah-blah
# to just DATE.mp4 and place it in the $HOME/Videos directory
original = None
for f in files:
    if 'vlc-record-'+today in f:
        original = f
        break

if original:
    if video in files:
        resp = input('Overwrite %s with %s? [Y] ' % (video, original))
        if resp is None or resp[0].upper() == 'Y':
            print('Renaming %s to %s' % (original, video))
            os.rename(original, video)
    else:
        print('Renaming %s to %s' % (original, video))
        os.rename(original, video)

elif video not in files:
    print('No recording found for today, '+today)
    sys.exit(1)
else:
    print('Video recording is already named correctly')


# Get the description of the service before all of the long-running tasks
description = input('Description: ')

#
# Extract the audio into its own file by using the Convert functions of VLC
#
audio = os.path.join(SERVICES_DIR, today + '.mp3')
if os.path.exists(audio):
    print("Audio has already been extracted from video")
else:
    print("Extracting audio from video recording")
    command = [
        # Note: cvlc runs withuot the GUI
        '/usr/bin/vlc',
        '--no-sout-video',
        '--sout',
        '#transcode{acodec=mp3,ab=128,channels=2,samplerate=44100}' + \
        ':std{access=file,mux=raw,dst=%s}' % (audio),
        video,
        'vlc://quit']
    subprocess.run(command)

# Upload the file to vimeo.
#  If it already exists, prompt to override
#  Else prompt for description

client = vimeo.VimeoClient(
  token=config['access_token'],
  key=config['client_id'],
  secret=config['client_secret']
)

# Is the video already available on vimeo?
response = client.get('/me/videos', params={'per_page': 1,
                                            'fields': 'uri',
                                            'query': today}).json()

if response['total'] > 0:
    resp = input('%s has already been uploaded. Overwrite? [Y] ' % (today))

    video_uri = response['data'][0]['uri']
    if resp is None or resp[0].upper() == 'Y':
        print("Uploading replacement video")
        client.replace(video_uri=video_uri, filename=video)
else:
    print("Uploading video.  This will take a while...")
    video_uri = client.upload(video, data={
        'name': today,
        'description': description,
        'content_rating': 'safe',
        'language': 'en-US',
    })

#
# Add the video to the Services channel
#

# Get the channel id
response = client.get('/channels/hopeservices', params={'fields': 'uri'})
response.raise_for_status()

channel_video_uri = response.json()['uri'] + video_uri

# See if the video is already in the services channel
response = client.get(channel_video_uri, params={'fields': 'uri'})
if response.status_code == 200:
    print("Video is already in the Services channel")
else:
    print("Adding video to the Services channel")
    response = client.put(channel_video_uri)
    response.raise_for_status()

    print('Video added to Services channel')

