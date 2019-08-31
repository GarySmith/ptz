import os
import paramiko
import tempfile
import time
from . import vlc

# Prerequisites:
# - Create a new directory for snapshots, and share it (over SMB/Windows
#   sharing) without password
# - enable the remote control interface in VLS (launch with vlc --intf rc, or
#   Preferences > Interface > Main interfaces > Remote control interface
# - Allocate a fake TTY
#   Preferences > Interface > Main interfaces > RC > Fake TTY
# - Assign a port to the RC interface
#   Preferences > Interface > Main interfaces > RC > TCP command input
#    e.g. 0.0.0.0:4200
# - enable video snapshots (Preferences > Video)
#   + Snapshot directory: (pick dir that was shared above)
#   + Format: jpg
#   + Video snapshot width: 200
#   + Video snapshot height: 110


def connect_sftp(host, user):

    port = 22

    # If there is an agent running, get the key from there, falling back
    # to ~/.ssh/id_rsa
    agent = paramiko.agent.Agent()
    keys = agent.get_keys()
    if len(keys) > 0:
        key = keys[0]
    else:
        key = paramiko.RSAKey.from_private_key_file(
            os.path.expanduser("~/.ssh/id_rsa"))

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=host,
                username=user,
                port=port,
                pkey=key)
    sftp = ssh.open_sftp()
    sftp.sshclient = ssh
    return sftp


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

    conn = connect_sftp(host, user)
    conn.chdir(snap_dir)

    images = [f for f in conn.listdir_attr('.')
              if f.filename.lower().split('.')[-1] in ('jpg', 'jpeg')]
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
