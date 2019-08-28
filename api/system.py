import ipaddress
import platform
import tempfile
import time
from smb.SMBConnection import SMBConnection
from smb import smb_constants as smbc
from nmb.NetBIOS import NetBIOS
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


def get_host_ip(host_or_ip):
    have_ip = False
    try:
        ipaddress.ip_address(host_or_ip)
        have_ip = True
    except ValueError:
        pass

    nb = NetBIOS()
    if have_ip:
        ip_addr = host_or_ip
        host = nb.queryIPForName(ip_addr)[0]
    else:
        host = host_or_ip
        ip_addr = nb.queryName(host)[0]

    nb.close()

    return host, ip_addr


def take_snapshot(host_or_ip, share, rc_port, delete_after=True):
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

    host, ip_addr = get_host_ip(host_or_ip)

    if not vlc.is_playing(ip_addr, rc_port):
        raise Exception('VLC is not playing')

    # Connect to vlc and issue snapshot command
    vlc.take_snapshot(ip_addr, rc_port)

    conn = SMBConnection('', '', platform.node(), host)
    assert conn.connect(ip_addr)

    shares = conn.listShares()
    names = [s.name for s in shares]
    if share not in names:
        raise Exception('%s not found on %s' % (share, host))

    file_list = sorted(conn.listPath(share, '/',
                                     smbc.SMB_FILE_ATTRIBUTE_NORMAL),
                       key=lambda f: f.last_write_time, reverse=True)

    if not file_list:
        raise Exception('There are no snapshots available')

    file = file_list[0]
    if time.time() - file.last_write_time > 60:
        raise Exception('There are no recent snapshots available')

    file_lower = file.filename.lower()
    if not (file_lower.endswith('.jpg') or file_lower.endswith('.jpeg')):
        raise Exception('The newest file is not a snapshot')

    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as fp:
        filename = fp.name
        attributes, size = conn.retrieveFile(share, file.filename, fp)

    if delete_after:
        # Delete the file from the remote system (where VLC runs) to avoid
        # leaving lots of files lying around
        conn.deleteFiles(share, file.filename)

    return filename
