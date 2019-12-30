#!/usr/bin/python3

import argparse
import datetime
import os
from subprocess import run, Popen, PIPE
import sys
from tempfile import mkstemp
import vimeo
import yaml

# Perform the normal wrapup tasks that are needed after the video recording
# has been completed including:
# - Rename the video to a human-friendly format
# - Extract the audio into a separate file into Dropbox
# - Upload the file to vimeo, with appropriate properties
# - Add the video to the Services channel in vimeo

# It is important that this script be idempotent, so that it can be run
# multiple times and only perform those steps that have not already been
# completed

parser = argparse.ArgumentParser(description="Wrap up the recording.")
parser.add_argument('--batch', '-b', action='store_true',
                    help='Avoid prompts and GUI messages')
parser.add_argument('--description', '-d',
                    help='Description of the video to show in Vimeo')
cmdargs = parser.parse_args()

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

original = [os.path.join(RECORDINGS_DIR, f)
            for f in os.listdir(RECORDINGS_DIR)
            if f.startswith('vlc-record-'+today)]
original.sort()

config = None
config_file = os.path.join(
    os.path.dirname(os.path.realpath(__file__)), 'config.json')
try:
    with open(config_file) as f:
        config = yaml.safe_load(f)
except Exception as e:
    message = '\n'.join(['Unable to load config.json', str(e)])
    if cmdargs.batch:
        print("Exiting: ", message)
    else:
        zenity('--error', '--no-wrap',
            '--ok-label', 'Exit',
            '--text', message)
    sys.exit(1)

# Convert the filename from the cryptic version that VLC creates,
#   vlc-record-DATE-blah-blah
# to just DATE.mp4 and place it in the $HOME/Videos directory

dest_video_exists = os.path.exists(video)

if original:

    if dest_video_exists and not cmdargs.batch:
        try:
            zenity("--question", "--no-wrap",
                   "--text", 'Overwrite %s?' % video)

        except Exception:
            sys.exit(1)

    if len(original) > 1:

        to_join = original
        if not cmdargs.batch:

            listargs=[]
            for item in original:
                listargs.append("TRUE")
                listargs.append(item)

            try:
                to_join = []
                out, _ = zenity("--list", "--checklist", "--separator", ",",
                                "--hide-header",
                                "--width", "500", "--height", "250",
                                "--column", "use", "--column", "file",
                                "--text", "Select files to join together",
                                *listargs)
                if out:
                    to_join = out.split(',')

            except Exception:
                sys.exit(1)

        if not to_join:
            print("Exiting since no files chosen")
            sys.exit(1)

        elif len(to_join) == 1:
            print('Renaming %s to %s' % (to_join[0], video))
            os.rename(to_join[0], video)
        else:
            # Join them together with ffmpeg:
            #   ffmpeg -f concat -safe 0 -i FILELIST.txt -c copy OUTPUT.mp4

            # Write list of tiles to temp file
            fd, path = mkstemp()
            with open(fd, 'w') as f:
                for fn in to_join:
                    f.write("file '%s'\n" % fn)

            # Call ffmpeg with file list in temp file
            command = [
                '/usr/bin/ffmpeg', '-f', 'concat', '-safe', '0', '-y',
                '-i', path, '-c', 'copy', video]
            run(command)

    else:
        print('Renaming %s to %s' % (original[0], video))
        os.rename(original[0], video)


elif not dest_video_exists:
    message = 'No recording found for today, '+today
    if cmdargs.batch:
        print(message)
    else:
        zenity('--error', '--no-wrap',
            '--ok-label', 'Exit',
            '--text', message)
    sys.exit(1)
else:
    print('Video recording is already named correctly')


# Get the description of the service before all of the long-running tasks
if cmdargs.description:
    description = cmdargs.description
elif cmdargs.batch:
    description = 'Recorded service for '+today
else:
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

    p = None
    if not cmdargs.batch:
        p = progress('Extracting audio from video recording')

    command = [
        # Note: cvlc runs without the GUI
        '/usr/bin/cvlc',
        '--no-sout-video',
        '--sout',
        '#transcode{acodec=mp3,ab=128,channels=2,samplerate=44100}' + \
        ':std{access=file,mux=raw,dst=%s}' % (audio),
        video,
        'vlc://quit']
    run(command)

    if p:
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
        if not cmdargs.batch:
            zenity("--question", "--no-wrap",
                "--text",
                '%s has already been uploaded. Overwrite?' % (today))

        p = None
        if not cmdargs.batch:
            p = progress("Uploading replacement video")
        client.replace(video_uri=video_uri, filename=video)

        if p:
            p.stdin.close()
    except Exception:
        pass

else:
    p = None
    if cmdargs.batch:
        print("Uploading video")
    else:
        p = progress('Uploading video')

    video_uri = client.upload(video, data={
        'name': today,
        'description': description,
        'content_rating': 'safe',
        'language': 'en-US',
    })
    if p:
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
if not cmdargs.batch:
    try:
        zenity("--info", "--no-wrap", "--text", message, "--timeout", "60")
    except Exception:
        # Ignore any exception thrown due to timeout
        pass
