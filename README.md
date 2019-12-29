PTZ Web Application
===================

Web application for interactng with a PTZ optics camera

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app/blob/master/packages/cra-template/template/README.md).

Getting started
---------------
Start the service listening on port 5100 with:

    tox

Start the UI listening on port 3000 with:

    yarn install && yarn start

The `/api` `target` entry in package.json controls where the
UI will connect to, and shouldd be set to `http://localhost:5100` for
local development.

Build
-----

To build the UI, use:

    npm run build

This slurps up the htmls, css, images, and everything.  We will want to exclude
the images from this since nginx will be serving them up directly.
configured nginx to proxy /api and /images calls to python server

Production installations
------------------------
Install `nginx`, `npm`, `uwsgi`, `redis`.

Follow the notes here: https://www.digitalocean.com/community/tutorials/how-to-serve-flask-applications-with-uwsgi-and-nginx-on-ubuntu-16-04
Then:

    sudo cp config/ptz.service to /etc/systemd/system
    sudo systemctl start ptz
    sudo systemctl enable ptz

copy `config/nginx_site` to `/etc/nginx/sites-available` and symlink it to `/etc/nginx/sites-enabled`
and then `service reload nginx`

Updates
-------

To update the UI:

- Build it on a development system as above
- `rsync --delete -av build/ pi://home/pi/ptz/ui`

To update the service:

    git pull
    sudo systemctl restart ptz

Presets
-------

The PTZ camera has an annoying property whereby the presets that are managed via
the hand-held remote control are entirely separate from those managed via its
API.  This becomes problematic if the presets are not kept in sync and the
handheld remote is used to control the camera.  Therefore it is advised to keep
them in sync by using the function in the UI to set the presets.

Future
------
Improvement and adjustments that are needed (not in any particular order):
- Sometimes remains flashing after moving to preset 3 (will need camera to replicate and address). As a potential insight into the problem, I noticed that the presets are shown in whatever order they are stored on the backend, so maybe the number field can get confused somehow?
- Incorporate react bootstrap everywhere
- Salt and encrypt passwords with multiple rounds, on the back end
- Use https
- Remove Delete User from the Add User dialog
- Replace polling with websockets for changes, including start/stop of recoding, change of camera position, change of
  presets.
- Add a UI setting for the rtsp feed
- Add button to the UI to detect when the recording has aborted and automatically restart it.  If possible, this feature
  may be automatically enabled depending on the time/date, but would need to figure out how to override it to actually
  stop recording
- Add ability in UI to run the wrapup script (and show its progress)
- Add logic in wrapup script to detect multiple recordings for the day and optionally concatenate them together using VLC.
