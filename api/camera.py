import socket
import time


INQ_FOCUS = bytes([ 0x81, 0x09, 0x04, 0x48, 0xFF ])
INQ_ZOOM = bytes([ 0x81, 0x09, 0x04, 0x47, 0xFF ])
INQ_PANTILT = bytes([ 0x81, 0x09, 0x06, 0x12, 0xFF ])
RECALL_PRESET = bytes([ 0x81, 0x01, 0x04, 0x3F, 0x02, 0x00, 0xFF ])
EOM = bytes([ 0xFF ])


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
        send_bytes(s, INQ_ZOOM)
        resp = receive_bytes(s)
        zoom = 0
        for i in range(2, 6):
            zoom = (zoom * 16) + (resp[i] & 0x0F)
        result['zoom'] = zoom

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((ip_address, port))

        # Get PAN, TILT
        send_bytes(s, INQ_PANTILT)
        resp = receive_bytes(s)
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

    start_time = time.time()
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((ip_address, port))
        send_bytes(s, req)
        resp = receive_bytes(s)

    last_pos = {}
    current_pos = get_position(ip_address, port)
    while(current_pos != last_pos and time.time() - start_time < 7):
        print("(Sleeping)")
        time.sleep(0.1)
        last_pos = current_pos
        current_pos = get_position(ip_address, port)
    print()


def send_bytes(s, msg):
    print ("Sent    : ", end="")
    total_sent = 0
    to_send = len(msg)
    while total_sent < to_send:
        sent = s.send(msg[total_sent:])

        print(" ".join("{:02X}".format(c) for c in msg[total_sent:sent]),
              end="")
        print(" ", end="")

        if sent == 0:
            raise RuntimeError("socket connection broken")
        total_sent = total_sent + sent

    print("")


def receive_bytes(s, maxlen=20):
    msg = bytearray()
    remaining = maxlen
    print("Received: ",end="")
    while remaining > 0:
        chunk = s.recv(1)
        if len(chunk) == 0:
            print("empty chunk received")
        else:
            print("{:02X}".format(chunk[0]), end="")
            print(" ", end="")
            msg.extend(chunk)
            if chunk == EOM:
                break

            remaining = maxlen - len(msg)

    print("")
    return msg

def test_connection(ip_address, port):

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect((ip_address, port))
        s.shutdown(socket.SHUT_RDWR)
        return True
    except socket.error as e:
        pass
