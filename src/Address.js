import React, { Component } from 'react';
import { Button, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import { doFetch } from './RestUtils.js';

class Address extends Component {
  constructor(props) {
    super(props);
      this.state= {
        addressInput: '196.168.100.88',  // Default address used by the camera
        portInput: '5678',               // Default port used by the camera
        addressValid: true,
        portValid: true,
        message: '',
      };
  }

  componentDidMount = () => {
    doFetch('/api/camera', 'GET')
    .then(response => {
      this.setState({addressInput: response.ip_address, portInput: response.ptz_port});
    })
  }

  updateAddressInput = (evt) => {
    const val = evt.target.value;
    const IPV4ADDRESS = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const addressValid = (IPV4ADDRESS.exec(val) !== null);
    this.setState({addressInput: val, addressValid: addressValid});
  }

  updatePortInput = (evt) => {
    const val = evt.target.value;
    const portValid = (0 < val && val < 65536); //if port number is between 1 and 65536, set disable button to false (enable button)
    this.setState({portInput: val, portValid: portValid});
  }

  onSubmit = (evt) => {
    evt.preventDefault();
    doFetch('/api/camera', 'POST', JSON.stringify({
      ip_address: this.state.addressInput,
      ptz_port: this.state.portInput,
    }))
    .then(response => {
        console.log("sent ip and port to api");
        this.props.onComplete();
    }).catch(error => {
      console.error("Error updating address/port: " + error);
      this.setState({message: 'Invalid host/port'});
    });
  }

  render() {
    const enableButton = this.state.portValid && this.state.addressValid;

    return (
      <div>
        <div className="header">Settings</div>
        <form className="settingsForm">
          <FormGroup controlId="cameraIPAddress" validationState={this.state.addressValid ? 'success' : 'error'}>
            <ControlLabel>IP Address</ControlLabel>
            <FormControl type="text" size={15} maxLength={15} value={this.state.addressInput} onChange={this.updateAddressInput}/>
            <FormControl.Feedback />
          </FormGroup>
          <FormGroup controlId="cameraPort" validationState={this.state.portValid ? 'success' : 'error'}>
            <ControlLabel>PTZ Port</ControlLabel>
            <FormControl type="number" min={1} max={65535} size={5} value={this.state.portInput} onChange={this.updatePortInput}/>
            <FormControl.Feedback />
          </FormGroup>
          <Button type="submit" bsStyle="success" disabled={! enableButton} onClick={this.onSubmit}>Submit</Button>
          <div className="error">{this.state.message}</div>
        </form>
      </div>
    );
  }
}

export default Address;
