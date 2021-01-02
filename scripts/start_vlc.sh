#!/bin/bash

want_mic=TONOR
want_camera=Pro_Webcam

if [[ -z "$(arecord -l | grep $want_mic)" ]] ; then
    mic=no_mic_plugged_in
else
    while read line ; do
        if [[ $line =~ $want_mic ]] ; then
            mic=$(echo $line | sed -n 's/^card \([0-9]*\):.*device \([0-9]*\):.*/hw:\1,\2/p')
            echo Found mic $line: $mic
        fi
    done < <(arecord -l | grep ^card)
fi

camera=no_camera_plugged_in
for device in /dev/video* ; do
    if [[ $(udevadm info -n $device | grep -e ID_V4L_CAPABILITIES.*capture) ]] ; then
        name=$(udevadm info -n $device | sed -n 's/^.* ID_MODEL=//p')
        if [[ $name =~ $want_camera ]] ; then
            camera="$device"
            echo Found mic $name: $device
            break
        fi
    fi
done

echo Mic: $mic
echo Camera: $camera
