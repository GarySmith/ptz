#!/bin/bash

# Detect whether we are inside or outside based on the presence
# of the wired interface IP address
if ip -o addr show enp3s0 | grep -q inet ; then
    # We have a LAN connection -- start the church VLC
    /usr/bin/vlc rtsp://192.168.0.88:554/2
else
    /usr/bin/python3 /data/ptz/scripts/start_vlc.py
fi
