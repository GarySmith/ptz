from flask import request, abort
from functools import wraps
import logging
from jose import jwt

LOG = logging.getLogger(__name__)


def needs_user():
    """
    Decorator to require that a valid user token be included with the cookies
    in the request
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            token = request.cookies.get('token')
            if not token:
                abort(401, "Not logged in")
            if not get_token_payload(token):
                abort(401, "Invalid token supplied")
            return func(*args, **kwargs)
        return wrapper

    return decorator


def needs_admin():
    """
    Decorator to require that a valid user token with admin priviledges to
    be included with the cookies in the request
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            token = request.cookies.get('token')
            if not token:
                abort(401, "Not logged in")
            token_payload = get_token_payload(token)
            if not token_payload:
                abort(401, "Invalid token supplied")
            if not token_payload.get('admin'):
                abort(403, "User must be an admin")

            return func(*args, **kwargs)
        return wrapper

    return decorator


SECRET = None


def get_secret():
    global SECRET
    if not SECRET:
        try:
            LOG.debug("loading secret.txt")
            with open('secret.txt') as f:
                SECRET = f.readline()

        except IOError:

            import uuid
            SECRET = uuid.uuid4().hex
            try:
                LOG.info("Creating new secret.txt")
                with open('secret.txt', 'w') as f:
                    f.write(SECRET)

            except IOError:
                LOG.error('Unable to save secret file. All sessions will ' +
                          'become invalid when the service restarts')
                pass
    return SECRET


AUDIENCE = 'ptzapp'


def get_token_payload(token):
    try:
        return jwt.decode(token, get_secret(), audience=AUDIENCE)
    except Exception as e:
        LOG.exception("Token invalid", exc_info=e)


def create_token(user, display_name='', admin=False):
    payload = {
        'user': user,
        'name': display_name,
        'admin': admin,
        'aud': AUDIENCE,
        # 'exp': int(time.time()) + 30,  # for testing expirate times
    }
    return jwt.encode(payload, get_secret(), algorithm='HS256')
