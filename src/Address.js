import React, { Component } from 'react';

class Address extends Component {
  constructor(props) {
    super(props);
      this.state= {
        addressInput: '128.0.0.0',
        portInput: '50',
        disableAdd: false,
        disablePort: false,
      };
  }
  componentDidMount = () => {
    const init = {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      }
    };

    fetch('/api/camera', init)
    .then(response => response.json())
    .then(response => {
      this.setState({addressInput: response.ip_address, portInput: response.ptz_port});
    })
  }

  updateAddressInput(evt) {
      const IPV4ADDRESS = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const val = evt.target.value;
      this.setState({addressInput: val});
      console.log("changed add: "+ val);
      if(IPV4ADDRESS.exec(val)===null) {
      this.setState({disableAdd:true}); //IP address is invalid, so disable button
      }
      else { //IP address is valid, enable button
      this.setState({disableAdd:false});
      }
  }
  updatePortInput(evt) {
      const val = evt.target.value;
      this.setState({portInput: val});
      console.log("changed port: "+ val);
      if(0 < val && val < 65536) {  //if port number is between 1 and 65536, set disable button to false (enable button)
      this.setState({disablePort: false});
      }
      else {   //if port number is less than 0 or greater than 65535, disable button
        this.setState({disablePort: true});
      }
  }
  submit() {
    let address = this.state.addressInput;
    console.log("address = " + address);

    let port = this.state.portInput;
    console.log("port= "+ port);

      const post = {
        method: 'POST',
        headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ip_address: address, ptz_port: port})
      };
      fetch('/api/camera', post)
    .then(response => response.json())
    .then(response => {
        console.log("sent ip and port to api");
    })
  }

  render() {
    let disableButton = this.state.disablePort || this.state.disableAdd;
    return (
    <div>
      <div className="header">Camera IP Address</div>
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
