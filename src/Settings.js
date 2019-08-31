import React, { Component } from 'react';
import { Button, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import { doFetch } from './RestUtils.js';

class Settings extends Component {
  constructor(props) {
    super(props);
      this.state= {
        cameraAddress: '196.168.100.88',  // Default address used by the camera
        cameraPort: '5678',               // Default port used by the camera
        cameraAddressValid: true,
        cameraPortValid: true,
        cameraMessage: '',

        vlcAddress: '',
        vlcRCPort: '',
        vlcSnapshotDir: '',
        vlcVideoDir: '',
        vlcUser: '',

        isVlcAddressValid: true,
        isVlcRCPortValid: true,
        vlcMessage: '',
      };
  }

  componentDidMount = () => {
    doFetch('/api/camera', 'GET')
    .then(response => {
      this.setState({
        cameraAddress: response.ip_address,
        cameraPort: response.ptz_port});
      return doFetch('/api/vlc', 'GET')
    })
    .then(response => {
      this.setState({
        vlcAddress: response.address,
        vlcRCPort: response.rc_port,
        vlcSnapshotDir: response.snapshot_dir,
        vlcVideoDir: response.video_dir,
        vlcUser: response.user,
      });
    })
  }

  isAddressValid(val) {
    const IPV4ADDRESS = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const HOST = /^(?=^.{1,254}$)(^(?:(?!\d+\.)[a-zA-Z0-9_-]{1,63}\.?)+(?:[a-zA-Z]{2,})$)/;
    return (IPV4ADDRESS.exec(val) !== null || HOST.exec(val) !== null);
  }

  updateCameraAddress = (evt) => {
    const val = evt.target.value;
    this.setState({cameraAddress: val, cameraAddressValid: this.isAddressValid(val)});
  }

  updateCameraPort = (evt) => {
    const val = evt.target.value;
    const portValid = (0 < val && val < 65536);
    this.setState({cameraPort: val, cameraPortValid: portValid});
  }

  updateVlcAddress = (evt) => {
    const val = evt.target.value;
    this.setState({vlcAddress: val, isVlcAddressValid: this.isAddressValid(val)});
  }

  updateVlcRcPort = (evt) => {
    const val = evt.target.value;
    const portValid = (0 < val && val < 65536);
    this.setState({vlcRCPort: val, isVlcRCPortValid: portValid});
  }

  updateVlcSnapshotDir = (evt) => {
    const val = evt.target.value;
    this.setState({vlcSnapshotDir: val});
  }

  updateVlcVideoDir = (evt) => {
    const val = evt.target.value;
    this.setState({vlcVideoDir: val});
  }

  updateVlcUser = (evt) => {
    const val = evt.target.value;
    this.setState({vlcUser: val});
  }

  onSubmitCamera = (evt) => {
    evt.preventDefault();
    doFetch('/api/camera', 'POST', JSON.stringify({
      ip_address: this.state.cameraAddress,
      ptz_port: this.state.cameraPort,
    }))
    .then(response => {
        console.log("sent ip and port to api");
        this.props.onComplete();
    }).catch(error => {
      console.error("Error updating address/port: " + error);
      this.setState({cameraMessage: error.message});
    });
  }

  onSubmitVLC = (evt) => {
    evt.preventDefault();
    doFetch('/api/vlc', 'POST', JSON.stringify({
      address :this.state.vlcAddress,
      rc_port :this.state.vlcRCPort,
      snapshot_dir: this.state.vlcSnapshotDir,
      video_dir: this.state.vlcVideoDir,
      user: this.state.vlcUser,
    }))
    .then(response => {
        console.log("Updated VLC information");
        this.props.onComplete();
    }).catch(error => {
      console.error("Error updating VLC information: " + error);
      this.setState({vlcMessage: error.message});
    });
  }

  render() {
    const enableSubmitCamera = this.state.cameraPortValid && this.state.cameraAddressValid;
    const enableSubmitVLC = this.state.isVlcAddressValid && this.state.isVlcRCPortValid;

    return (
      <div>
        <div className="header">Camera Settings</div>
        <form className="settingsForm">
          <FormGroup controlId="cameraAddress" validationState={this.state.cameraAddressValid ? 'success' : 'error'}>
            <ControlLabel>Hostname or IP Address</ControlLabel>
            <FormControl type="text" size={25} maxLength={25} value={this.state.cameraAddress} onChange={this.updateCameraAddress}/>
            <FormControl.Feedback />
          </FormGroup>
          <FormGroup controlId="cameraPort" validationState={this.state.cameraPortValid ? 'success' : 'error'}>
            <ControlLabel>Port</ControlLabel>
            <FormControl type="number" min={1} max={65535} size={5} value={this.state.cameraPort} onChange={this.updateCameraPort}/>
            <FormControl.Feedback />
          </FormGroup>
          <Button type="submit" bsStyle="success" disabled={! enableSubmitCamera} onClick={this.onSubmitCamera}>Submit</Button>
          <div className="error">{this.state.cameraMessage}</div>
        </form>
        <div className="header">VLC Settings</div>
        <form className="settingsForm">
          <FormGroup controlId="vlcAddress" validationState={this.state.isVlcAddressValid ? 'success' : 'error'}>
            <ControlLabel>Hostname or IP Address</ControlLabel>
            <FormControl type="text" size={15} maxLength={15} value={this.state.vlcAddress} onChange={this.updateVlcAddress}/>
            <FormControl.Feedback />
          </FormGroup>
          <FormGroup controlId="vlcRCPort" validationState={this.state.isVlcRCPortValid ? 'success' : 'error'}>
            <ControlLabel>Remote Control (RC) Port</ControlLabel>
            <FormControl type="number" min={1} max={65535} size={5} value={this.state.vlcRCPort} onChange={this.updateVlcRcPort}/>
            <FormControl.Feedback />
          </FormGroup>
          <FormGroup controlId="VLCUser" validationState='success'>
            <ControlLabel>SSH User (for camera snapshots)</ControlLabel>
            <FormControl type="text" size={25} maxLength={25} value={this.state.vlcUser} onChange={this.updateVlcUser}/>
            <FormControl.Feedback />
          </FormGroup>
          <FormGroup controlId="VLCSnapshotDir" validationState='success'>
            <ControlLabel>Snapshot Directory</ControlLabel>
            <FormControl type="text" size={25} maxLength={25} value={this.state.vlcSnapshotDir} onChange={this.updateVlcSnapshotDir}/>
            <FormControl.Feedback />
          </FormGroup>
          <FormGroup controlId="VLCVideoDir" validationState='success'>
            <ControlLabel>Video Directory</ControlLabel>
            <FormControl type="text" size={25} maxLength={25} value={this.state.vlcVideoDir} onChange={this.updateVlcVideoDir}/>
            <FormControl.Feedback />
          </FormGroup>
          <Button type="submit" bsStyle="success" disabled={! enableSubmitVLC} onClick={this.onSubmitVLC}>Submit</Button>
          <div className="error">{this.state.vlcMessage}</div>
        </form>
      </div>
    );
  }
}

export default Settings;
