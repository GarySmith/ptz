#!/usr/bin/python3

import datetime
import os
from subprocess import run, Popen, PIPE
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


def progress(message='Message'):
    command = ['/usr/bin/zenity',
               '--progress',
               '--pulsate',
               '--no-cancel',
               '--auto-close',
               '--text',
               message]
    proc = Popen(command, stdout=PIPE, stderr=PIPE, stdin=PIPE)
    if proc.returncode:
        raise Exception()
    return proc


def zenity(*args, **kwargs):
    command = ['/usr/bin/zenity']
    if args:
        command.extend(args)

    proc = Popen(command, stdout=PIPE, stderr=PIPE)
    (out, errs) = proc.communicate()
    if proc.returncode != 0:
        raise Exception()

    return (out.decode('utf-8').rstrip(), errs.decode('utf-8').rstrip())


RECORDINGS_DIR = os.path.join(os.path.expanduser('~'), 'Videos')
SERVICES_DIR = os.path.join(os.path.expanduser('~'), 'Dropbox', 'Services')
today = datetime.datetime.now().strftime('%Y-%m-%d')
video = os.path.join(RECORDINGS_DIR, today + '.mp4')

files = [os.path.join(RECORDINGS_DIR, f)
         for f in os.listdir(RECORDINGS_DIR) if today in f]

config = None
config_file = os.path.join(
    os.path.dirname(os.path.realpath(__file__)), 'config.json')
try:
    with open(config_file) as f:
        config = yaml.safe_load(f)
except Exception as e:
    zenity('--error', '--no-wrap',
           '--ok-label', 'Exit',
           '--text', '\n'.join(['Unable to load config.json', str(e)]))
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
        try:
            zenity("--question", "--no-wrap",
                   "--text", 'Overwrite %s with %s?' % (video, original))
            print('Renaming %s to %s' % (original, video))
            os.rename(original, video)

        except Exception:
            pass
    else:
        print('Renaming %s to %s' % (original, video))
        os.rename(original, video)

elif video not in files:
    zenity('--error', '--no-wrap',
           '--ok-label', 'Exit',
           '--text', 'No recording found for today, '+today)
    sys.exit(1)
else:
    print('Video recording is already named correctly')


# Get the description of the service before all of the long-running tasks
try:
    out, _ = zenity('--title', 'Video Description',
                    '--entry',
                    '--width', '800',
                    '--text', 'Description of the video to show in Vimeo')
except Exception:
    sys.exit(1)

description = out

#
# Extract the audio into its own file by using the Convert functions of VLC
#
audio = os.path.join(SERVICES_DIR, today + '.mp3')
if os.path.exists(audio):
    print("Audio has already been extracted from video")
else:
    p = progress('Extracting audio from video recording')
    command = [
        # Note: cvlc runs withuot the GUI
        '/usr/bin/vlc',
        '--no-sout-video',
        '--sout',
        '#transcode{acodec=mp3,ab=128,channels=2,samplerate=44100}' + \
        ':std{access=file,mux=raw,dst=%s}' % (audio),
        video,
        'vlc://quit']
    run(command)
    p.stdin.close()

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
    try:
        video_uri = response['data'][0]['uri']
        zenity("--question", "--no-wrap",
               "--text",
               '%s has already been uploaded. Overwrite?' % (today))
        p = progress("Uploading replacement video")
        client.replace(video_uri=video_uri, filename=video)
        p.stdin.close()
    except Exception:
        pass

else:
    p = progress('Uploading video')
    video_uri = client.upload(video, data={
        'name': today,
        'description': description,
        'content_rating': 'safe',
        'language': 'en-US',
    })
    p.stdin.close()

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

message = "Wrapup complete"
print(message)
zenity("--info", "--no-wrap", "--text", message)
