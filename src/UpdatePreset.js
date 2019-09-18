import React, { Component } from 'react';
import { Button, Checkbox, Form, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import { doFetch } from './RestUtils.js';

class UpdatePreset extends Component {
  constructor(props) {
    super(props);
    this.state = {
      disableButton: true,
      preset: '1',
      updateSnapshot: false,
      message: '',
    };
  }
  componentDidMount = () => {
    if(this.props.admin) {
      this.setState({disableButton: false});
    }
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
