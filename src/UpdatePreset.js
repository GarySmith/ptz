import React, { Component } from 'react';
import { Button, Checkbox, Form, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import { doFetch } from './RestUtils.js';
import PhotoCamera from '@material-ui/icons/PhotoCamera';

class UpdatePreset extends Component {
  constructor(props) {
    super(props);
    this.state = {
      disableButton: true,
      preset: '1',
      updateSnapshot: false,
      message: '',
      snapshotTimestamp: 0,  // time when snapshot taken (-1 == none available)
    };
  }
  componentDidMount = () => {
    if(this.props.admin) {
      this.setState({disableButton: false});
    }
  }

  setSnapshotTimer = () => {
      this.snapshotTimer = setTimeout(() => {
        this.setState({snapshotTimestamp: 0});
        this.snapshotTimer = null;
      }, 2500);
  }

  takeSnapshot = () => {
    debugger;
    if (this.snapshotTimer) {
      console.log('snapshot is already being shown. Taking a new one');
      clearTimeout(this.snapshotTimer);
      this.setState({snapshotTimestamp: 0});
    }

    doFetch('/api/vlc/is_playing', "GET")
    .then(response => {
      let timestamp = -1;

      if (response) {
        // Use a unique query parameter so that the browser takes
        // a new snapshot rather than serving up an old one
        timestamp = new Date().getTime();
      }

      this.setState({snapshotTimestamp: timestamp});
      this.setSnapshotTimer();
    })
    .catch(error => {
      this.setState({snapshotTimestamp: -1});
      this.setSnapshotTimer();
    });
  }


  onCheckboxToggled = (evt) => {
    const checked = evt.target.checked;
    this.setState({updateSnapshot: checked});
  }

  updatePreset = (evt) => {
    const val = evt.target.value;
    this.setState({preset: val});
  }

  onSubmit = (evt) => {
    evt.preventDefault();
    const presetUrl = '/api/preset/' + this.state.preset;
    doFetch(presetUrl, "POST")
    .then(response => {
      if (this.state.updateSnapshot) {
        const snapshotUrl = '/api/vlc/snapshot/' + this.state.preset;
        return doFetch(snapshotUrl, 'POST')
      }
    })
  }

  render() {
    let img;
    if (this.state.snapshotTimestamp > 0) {
      img = (<img alt='snapshot' src={"/api/vlc/snapshot?t=" + this.state.snapshotTimestamp}/>);
    } else if (this.state.snapshotTimestamp < 0) {
      img = (<img alt='snapshot' src={process.env.PUBLIC_URL + 'images/not_playing.png'} />);
    }
    // Need to add button for previewing camera.  Steal that logic from App.js
    return (
      <div>
        <div className="header">Update Preset</div>
        <p>
        The PTZ camera uses a separate memory area for presets used by the physical remote control from the ones used in
        its programmatic interface.  In order for both the remote control and the application to be used interchangeably,
        it is important that they be kept in sync.  That is the purpose of this page.
        </p>
        <p>
        First, do the following with the physical remote control:
        </p>
        <ul>
          <li>Use the arrow buttons and zoom buttons to position the camera as desired</li>
          <li>Update the preset on the remote:
            <ul>
              <li>Hold the PRESET button and press the number button</li>
              <li>Press the number button again</li>
            </ul>
          </li>
        </ul>
        <p>
          After that is done, enter the same preset number below.
        </p>
        <div className="snapshot">
          <PhotoCamera className='camera' onClick={this.takeSnapshot} />
          {img}
        </div>
        <Form className="settingsForm">
          <div><Checkbox inline onChange={this.onCheckboxToggled} checked={this.state.updateSnapshot}>Update Snapshot</Checkbox></div>
          <FormGroup controlId="preset">
            <ControlLabel>Preset</ControlLabel>
            <FormControl type="number" min={1} max={255} value={this.state.preset} onChange={this.updatePreset}/>
          </FormGroup>
          <Button type="submit" bsStyle="success" onClick={this.onSubmit}>Submit</Button>
          <div className="error">{this.state.message}</div>
        </Form>
      </div>
    );
   }
}

export default UpdatePreset;
