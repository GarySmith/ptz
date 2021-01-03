#!/usr/bin/python3

# VLC presents audio and video device names in its user interface as the unix
# device name rather than the human-friendly device. For example, the
# available camera list might be '/dev/video0' and /dev/video1' instead of
# 'Integrated_Webcam_HD' and 'HD_Pro_Webcam_C920'. Similarly for audio the
# devices are shown as strings like "hw:0,0'. This script determines the
# "proper" devices for the camera and microphone used for outdoor service
# recordings

import glob
import re
import shutil
from subprocess import check_output, call
import sys

want_mic = "TONOR"
want_camera = "Pro_Webcam"

zenity = shutil.which('zenity')

mic = None
while not mic:

    arecord = shutil.which('arecord')
    mic_details = check_output([arecord, "-l"], text=True).strip().split('\n')

    for line in mic_details:
        matches = re.match(r'^card (\d+):(.*), device (\d+):', line)
        if matches:
            card = matches.group(1)
            name = matches.group(2)
            device = matches.group(3)

            if want_mic in name:
                mic = f'hw:{card},{device}'
                break

    if not mic:
        # Use zenity to prompt to plugin mic and look again or to exit
        resp = call([zenity,
                     '--question',
                     '--text', f'Microphone {want_mic} could not be found.'
                               ' Make sure it is plugged in',
                     '--no-wrap',
                     '--ok-label', 'Retry',
                     '--cancel-label', 'Quit'])
        if resp == 1:
            sys.exit()

udevadm = shutil.which('udevadm')
camera = None
while not camera:
    for device in glob.glob('/dev/video*'):

        video_details = check_output([udevadm, 'info', '-n', device],
                                     text=True).strip().split('\n')

        is_capture_device = False
        name = ''
        for line in video_details:
            if re.search(r'ID_V4L_CAPABILITIES.*capture', line):
                is_capture_device = True

            matches = re.search(r' ID_MODEL=(.*)$', line)
            if matches:
                name = matches.group(1)

        if is_capture_device and want_camera in name:
            camera = device

    if not camera:
        # Use zenity to prompt to plugin mic and look again or to exit
        resp = call([zenity,
                     '--question',
                     '--text', f'Camera {want_camera} could not be found. '
                               'Make sure it is plugged in',
                     '--no-wrap',
                     '--ok-label', 'Retry',
                     '--cancel-label', 'Quit'])
        if resp == 1:
            sys.exit()

print(f'Mic: {mic}')
print(f'Camera: {camera}')
