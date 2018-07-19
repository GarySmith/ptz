import React, { Component } from 'react';
import { doFetch } from './RestUtils.js';

class Address extends Component {
  constructor(props) {
    super(props);
      this.state= {
        addressInput: '128.0.0.0',
        portInput: '50',
        disableAdd: false,
        disablePort: false,
      };
  } //this.props.admin
  componentDidMount = () => {
    doFetch('/api/camera', 'GET')
    .then(response => {
      this.setState({addressInput: response.ip_address, portInput: response.ptz_port});
    })
    if(!this.props.admin) {
      this.setState({disableAdd:true, disablePort: true});
    }
  }

  updateAddressInput(evt) {
      const IPV4ADDRESS = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const val = evt.target.value;
      this.setState({addressInput: val});
      if(IPV4ADDRESS.exec(val)===null) {
      this.setState({disableAdd:true}); //IP address is invalid, so disable button
      }
      else if (this.props.admin) { //IP address is valid and admin is logged in: enable button
        this.setState({disableAdd:false});
      }
  }
  updatePortInput(evt) {
      const val = evt.target.value;
      this.setState({portInput: val});
      if(0 < val && val < 65536 && this.props.admin) {  //if port number is between 1 and 65536, set disable button to false (enable button)
      this.setState({disablePort: false});
      }
      else {   //if port number is less than 0 or greater than 65535, disable button
        this.setState({disablePort: true});
      }
  }
  submit() {
    let address = this.state.addressInput;

    let port = this.state.portInput;

      const post = {
        method: 'POST',
        headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        },
        credentials: "same-origin",
        body: JSON.stringify({ip_address: address, ptz_port: port})
      };
      doFetch('/api/camera', 'POST', JSON.stringify({ip_address: address, ptz_port: port}))
    .then(response => {
        console.log("sent ip and port to api");
    })
  }

  render() {
    let disableButton = this.state.disablePort || this.state.disableAdd;
    return (
    <div>
      <div className="header">Settings</div>
      <div className="view">

        <div className="imgRow viewDiv">IP Address:<input type= "text" key="newAddress"
          value={this.state.addressInput} onChange={this.updateAddressInput.bind(this)}></input></div>

        <div className="imgRow viewDiv">PTZ Port:<input type= "text" key="newPort"
          value={this.state.portInput} onChange={this.updatePortInput.bind(this)}></input></div>

        <div className="imgRow viewDiv">
          <button key="addressButton" disabled={disableButton} onClick={() => this.submit()}>Enter</button></div>

      </div>
    </div>
  );
  }
}

export default Address;
