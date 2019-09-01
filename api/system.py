import tempfile
import time
from . import network
from . import vlc

# Prerequisites:
# - Create new directories for snapshots and, if necessary, for videos
# - enable the remote control interface in VLS (launch with vlc --intf rc, or
#   Preferences > Interface > Main interfaces > Remote control interface
# - Allocate a fake TTY
#   Preferences > Interface > Main interfaces > RC > Fake TTY
# - Assign a port to the RC interface
#   Preferences > Interface > Main interfaces > RC > TCP command input
#    e.g. 0.0.0.0:4200
# - enable video snapshots (Advanced Preferences > Video)
#   + Snapshot directory: (pick dir that was created above)
#   + Format: jpg
#   + Video snapshot width: 200
#   + Video snapshot height: 110


# Maximum expected time between disk writes when recording video.  This
# value is used to decide whether the current video capture file is
# actively being written to.  The value controls how long the
# is_video_capturing api will pause, so using a large value will cause
# delays when querying for status.  Conversely, if the value is too short,
# then it might give misleading results if the system can actually buffer
# video for more than this interval.
MAX_WRITE_INTERVAL = 1.0


def take_snapshot(host, rc_port, user, snap_dir, delete_after=True):
    """Take snapshot of the current vlc video feed

    Use the remote control interface on the camera to capture a
    snapshot of the camera feed and transfer the file to the server.
    This effectively tests the entire setup for snapshots, including verifying
    that:
    - vlc is running and its remote control interface is available
    - the credentials for the remote control interface are set properly
    - vlc is correctly setup to save snapshots into a directory
    - that directory is setup for sharing

    Returns the filename on the server of the captured snapshot
    """

    is_playing = False
    try:
        is_playing = vlc.is_playing(host, rc_port)
    except Exception as e:
        raise Exception('Unable to connect to VLC')

    if not is_playing:
        raise Exception('VLC is not playing')

    # Connect to vlc and issue snapshot command
    vlc.take_snapshot(host, rc_port)

    conn = network.connect_sftp(host, user)
    conn.chdir(snap_dir)

    images = [f for f in conn.listdir_attr('.')
              if f.filename.split('.')[-1] in ('jpg', 'jpeg')]
    file_list = sorted(images, key=lambda f: f.st_mtime, reverse=True)

    if not file_list:
        raise Exception('There are no snapshots available')

    file = file_list[0]
    if time.time() - file.st_mtime > 60:
        raise Exception('There are no recent snapshots available')

    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as fp:
        filename = fp.name
        conn.getfo(file.filename, fp)

    if delete_after:
        # Delete the file from the remote system (where VLC runs) to avoid
        # leaving lots of files lying around
        conn.remove(file.filename)

    if conn is not None:
        conn.close()

    return filename


def is_video_capturing(host, user, video_dir):

    conn = network.connect_sftp(host, user)
    conn.chdir(video_dir)

    videos = [f for f in conn.listdir_attr('.')
              if f.filename.split('.')[-1] in ('mp4', 'avi')]
    file_list = sorted(videos, key=lambda f: f.st_mtime, reverse=True)

    if not file_list:
        return False

    file = file_list[0]
    if time.time() - file.st_mtime > MAX_WRITE_INTERVAL:
        return False

    last_time = file.st_mtime

    time.sleep(MAX_WRITE_INTERVAL)
    file = conn.stat(file.filename)
    conn.close()

    return last_time < file.st_mtime
