import socket

INQ_FOCUS = bytes([ 0x81, 0x09, 0x04, 0x48, 0xFF ])
INQ_ZOOM = bytes([ 0x81, 0x09, 0x04, 0x47, 0xFF ])
INQ_PANTILT = bytes([ 0x81, 0x09, 0x06, 0x12, 0xFF ])
RECALL_PRESET = bytes([ 0x81, 0x01, 0x04, 0x3F, 0x02, 0x00, 0xFF ])


def get_position(ip_address, port):
    # Communicates with the PTZ camera and obtains its current position, which
    # is an object with the following fields, all of which are integers in the
    # range 0-32767: zoom, focus, pan, tilt

    result = {
        'zoom': 0,
        'focus': 0,
        'pan': 0,
        'tilt': 0
    }

    # The camera closes the socket after every interaction, so open a new
    # one for each command
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((ip_address, port))

        # Get ZOOM
        mysend(s, INQ_ZOOM)
        resp = myreceive(s, 7)
        zoom = 0
        for i in range(2, 6):
            zoom = (zoom * 16) + (resp[i] & 0x0F)
        result['zoom'] = zoom

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((ip_address, port))

        # Get FOCUS
        mysend(s, INQ_FOCUS)
        resp = myreceive(s, 7)
        focus = 0
        for i in range(2, 6):
            focus = (focus * 16) + (resp[i] & 0x0F)
        result['focus'] = focus

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((ip_address, port))

        # Get PAN, TILT
        mysend(s, INQ_PANTILT)
        resp = myreceive(s, 11)
        pan = 0
        for i in range(2, 6):
            pan = (pan * 16) + (resp[i] & 0x0F)
        result['pan'] = pan

        tilt = 0
        for i in range(6, 10):
            tilt = (tilt * 16) + (resp[i] & 0x0F)
        result['tilt'] = tilt

    return result

def recall_preset(ip_address, port, preset):

    req = RECALL_PRESET[0:5] + bytes([preset]) + RECALL_PRESET[6:7]

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((ip_address, port))
        mysend(s, req)
        resp = myreceive(s, 6)


def mysend(s, msg):
    total_sent = 0
    to_send = len(msg)
    while total_sent < to_send:
        sent = s.send(msg[total_sent:])
        if sent == 0:
            raise RuntimeError("socket connection broken")
        total_sent = total_sent + sent


def myreceive(s, maxlen):
    msg = bytearray()
    remaining = maxlen
    while remaining > 0:
        chunk = s.recv(remaining)
        if len(chunk) == 0:
            print("empty chunk received")
        else:
            msg.extend(chunk)
            remaining = maxlen - len(msg)

    return msg
