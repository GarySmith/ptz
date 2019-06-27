from . import network
import socket
import time


INQ_FOCUS = bytes([0x81, 0x09, 0x04, 0x48, 0xFF])
INQ_ZOOM = bytes([0x81, 0x09, 0x04, 0x47, 0xFF])
INQ_PANTILT = bytes([0x81, 0x09, 0x06, 0x12, 0xFF])
RECALL_PRESET = bytes([0x81, 0x01, 0x04, 0x3F, 0x02, 0x00, 0xFF])
EOM = bytes([0xFF])


def get_position(ip_address, port):
    # Communicates with the PTZ camera and obtains its current position, which
    # is an object with the following fields, all of which are integers in the
    # range 0-32767: zoom, pan, tilt

    result = {
        'zoom': 0,
        'pan': 0,
        'tilt': 0
    }

    # The camera closes the socket after every interaction, so open a new
    # one for each command
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((ip_address, port))

        # Get ZOOM
        network.send_bytes(s, INQ_ZOOM)
        resp = network.receive_bytes(s, EOM)
        zoom = 0
        if len(resp) > 6:
            for i in range(2, 6):
                zoom = (zoom * 16) + (resp[i] & 0x0F)
        result['zoom'] = zoom

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((ip_address, port))

        # Get PAN, TILT
        network.send_bytes(s, INQ_PANTILT)
        resp = network.receive_bytes(s, EOM)
        pan = 0
        if len(resp) > 6:
            for i in range(2, 6):
                pan = (pan * 16) + (resp[i] & 0x0F)
        result['pan'] = pan

        tilt = 0
        if len(resp) > 10:
            for i in range(6, 10):
                tilt = (tilt * 16) + (resp[i] & 0x0F)
        result['tilt'] = tilt

    return result


def recall_preset(ip_address, port, preset):

    req = RECALL_PRESET[0:5] + bytes([preset]) + RECALL_PRESET[6:7]

    start_time = time.time()
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((ip_address, port))
        network.send_bytes(s, req)
        network.receive_bytes(s, EOM)

    last_pos = {}
    current_pos = get_position(ip_address, port)
    while(current_pos != last_pos and time.time() - start_time < 7):
        network.debug_print("(Sleeping while camera moves)")
        time.sleep(0.1)
        last_pos = current_pos
        current_pos = get_position(ip_address, port)
