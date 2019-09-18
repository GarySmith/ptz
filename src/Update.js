import React, { Component } from 'react';
import { Button, Form, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import { doFetch } from './RestUtils.js';

class Update extends Component {
  constructor(props) {
    super(props);
    this.state = {
      disableButton: true,
      preset: '1',
      message: '',
    };
  }
  componentDidMount = () => {
    if(this.props.admin) {
      this.setState({disableButton: false});
    }
  }

  updatePreset = (evt) => {
    const val = evt.target.value;
    this.setState({preset: val});
  }

  onSubmit = () => {
    const url = '/api/preset/' + this.state.preset;
    doFetch(url, "POST")
    // call change_preset, and optionally call update_preset_snapshot
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

export default Update;
