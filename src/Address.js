import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
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

  onSubmit = () => {
    this.setState({message: ''});  // Clear any error message if retrying
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
    let enableButton = this.state.portValid && this.state.addressValid;
    let errorMessage;

    if (this.state.message) {
       errorMessage = (<div className="error">{this.state.message}</div>);
    }

    return (
    <div>
      <div className="header">Settings</div>
      <div className="view">

        <div className="imgRow viewDiv">IP Address:<input type= "text" key="newAddress"
          value={this.state.addressInput} onChange={this.updateAddressInput}></input></div>

        <div className="imgRow viewDiv">PTZ Port:<input type= "text" key="newPort"
          value={this.state.portInput} onChange={this.updatePortInput}></input></div>

        <div className="imgRow viewDiv">
          {errorMessage}
          <Button type="submit" bsStyle="success" disabled={! enableButton} onClick={this.onSubmit}>submit</Button>
        </div>

      </div>
    </div>
  );
  }
}

export default Address;
