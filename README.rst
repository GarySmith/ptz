===================
PTZ Web Application
===================

Web application for interactng with a PTZ optics camera

Getting started
---------------
Start the service listening on port 5100 with::

   tox

Start the UI listening on port 3000 with::

   yarn install && yarn start

The `/api` `target` entry in package.json controls where the
UI will connect to, and shouldd be set to `http://localhost:5100` for
local development.

Build
-----

To build the UI, use::

   npm run build

This slurps up the htmls, css, images, and everything.  We will want to exclude
the images from this since nginx will be serving them up directly.
configured nginx to proxy /api and /images calls to python server

Production installations
------------------------
Install `nginx`, `npm`, `uwsgi`.

Follow the notes here: https://www.digitalocean.com/community/tutorials/how-to-serve-flask-applications-with-uwsgi-and-nginx-on-ubuntu-16-04
sudo cp config/ptz.service to /etc/systemd/system
sudo systemctl start ptz
sudo systemctl enable ptz

copy config/nginx_site to /etc/nginx/sites-available and symlink it to sites-enabled
service reload nginx

Updates
-------
To update the UI:

- Build it as above
- rsync --delete -av build/ pi://home/pi/ptz/ui

Presets
-------
The PTZ camera has an annoying property whereby the presets that are managed via
the hand-held remote control are entirely separate from those managed via its
API.  This becomes problematic if the presets are not kept in sync and the
handheld remote is used to control the camera.  Therefore it is advised to keep
them in sync.  The easiest way to do this is to always make changes to preset
positions first using the hand-held remote.  After all changes are made, login
to the camera's web page and for each preset on the remote, press the remote
button to move the camera, and then update the corresponding preset on the web
page.
