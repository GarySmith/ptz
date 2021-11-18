#!/bin/bash

# At login, this script is automatically run.  This script will launch
# vlc with the appropriate input device and also set vlc to automatically
# start recording at well-known recording times, via 'control_vlc setup'


# Detect whether the laptop is at hope. 
if ip -o addr show up wlo1 | grep 'inet ' | grep -q 192.168.0\\. ; then

    # Detect whether we are inside or outside based on the presence
    # of the wired interface IP address
    if ip -o addr show enp3s0 | grep -q inet ; then
        # We have a LAN connection -- start the church VLC
        /usr/bin/vlc rtsp://192.168.0.88:554/2 &
        /data/ptz/scripts/control_vlc setup
    else
        /data/ptz/scripts/control_vlc setup
        /usr/bin/python3 /data/ptz/scripts/start_vlc.py
    fi

else
    /usr/bin/vlc 'v4l2:///dev/video0::live-caching=300' &
    /data/ptz/scripts/control_vlc setup
fi
