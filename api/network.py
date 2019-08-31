import os
import paramiko
import socket

# Enable debugging the network traffic with print statements.  These
# give a real-time, digestible format for logging, as opposed to logging
# statements
DEBUG_PRINT = True


def send_bytes(s, msg):
    debug_print("Sent    : ", end="")
    total_sent = 0
    to_send = len(msg)
    while total_sent < to_send:
        sent = s.send(msg[total_sent:])

        debug_print(msg[total_sent:sent], end="")

        if sent == 0:
            raise RuntimeError("socket connection broken")
        total_sent = total_sent + sent

    debug_print(msg, display_text=True)


def receive_bytes(s, maxlen=20, eom=None):
    msg = bytearray()
    remaining = maxlen
    debug_print("Received: ", end="")
    while remaining > 0:
        chunk = s.recv(1)
        if len(chunk) == 0:
            debug_print("socket connection broken")
            break
        else:
            debug_print(chunk, end="")
            msg.extend(chunk)
            if eom and msg.endswith(eom):
                break

            remaining = maxlen - len(msg)

    debug_print(msg, display_text=True)

    return msg


def test_connection(ip_address, port):

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect((ip_address, port))
        s.shutdown(socket.SHUT_RDWR)
        return True
    except socket.error:
        pass


def debug_print(msg=None, display_text=False, end='\n'):

    if not DEBUG_PRINT:
        return

    if msg is None:
        print(end=end, flush=True)
    elif isinstance(msg, (bytes, bytearray)):
        if display_text:
            print("(", end='')
            print("".join([(chr(c) if chr(c).isprintable() else '.')
                           for c in msg])+")", end='')
        else:
            print(" ".join("{:02X}".format(c) for c in msg)+" ", end='')

        print('', end=end, flush=True)
    else:
        print(msg, end=end, flush=True)


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


def test_sftp_connection(host, user, directory):

    conn = connect_sftp(host, user)

    try:
        conn.chdir(directory)
    except IOError as e:
        raise Exception("No such directory")
    finally:
        conn.close()
