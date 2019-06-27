from . import network
import socket


def is_playing(ip_address, port):

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((ip_address, port))

        network.send_bytes(s, b'is_playing\n')
        resp = 'tombstone'
        while len(resp) > 3:
            resp = network.receive_bytes(s, maxlen=80, eom=b'\r\n')
        network.send_bytes(s, b'logout\n')

        return resp.decode()[0] == '1'
