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


def take_snapshot(ip_address, port):

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((ip_address, port))

        network.send_bytes(s, b'snapshot\n')
        network.receive_bytes(s, maxlen=80, eom=b'\r\n')
        network.send_bytes(s, b'logout\n')


def send_keypress(ip_address, port, keyname):

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((ip_address, port))

        # Convert keyname to bytes if it is a string
        # Use str.format, since interpolated strings are new to 3.6 and the
        # raspberry pi only runs 3.5
        command = str.format('key {}\nlogout\n', keyname)
        network.send_bytes(s, bytes(command, 'utf-8'))
