import React, { Component } from 'react';
import { doFetch } from './RestUtils.js';
import { Button } from 'react-bootstrap';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      triedUser: '',
      triedPass: '',
      success: false,
      attempts: 0,
    };
  }
  submitClicked = (evt) => {
    evt.preventDefault();
    let attemptedUsername = this.state.triedUser;
    let hashedPassword = this.createHash();
 //  let hashedPassword = this.state.triedPass;
    console.log('submit clicked');
    const body = JSON.stringify({username: attemptedUsername, password: hashedPassword});
    doFetch('/api/login', 'POST', body)
    .then(response => {
          this.setState({success: true, attempts: 1});
          this.props.onSuccess(attemptedUsername, response.display_name, response.admin);
      })
    .catch((error) => {
       console.log("error is: " + error);
       this.setState({success: false, attempts: 1});
    })
  }
  createHash() {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.state.triedPass);
    hmac.update('password');
    return (hmac.digest('hex'));
  }

  updateUser(evt) {
    // Capture the target value, which may change by the time setState executes
    const val = evt.target.value;
    this.setState({triedUser: val});
  }
  updatePass(evt) {
    // Capture the target value, which may change by the time setState executes
    const val = evt.target.value;
    this.setState({triedPass: val});
  }

  render() {
    let message = "";
    let messageClass='imgRow viewDiv';
    if(this.state.success) {
      messageClass='imgRow viewDiv green';
      message = "Welcome user!";
    }
    else if(this.state.attempts>0){
      message = "Login failed.";
      messageClass ='imgRow viewDiv red';
    }
    return (
      <div>
        <div className="header">Login</div>
        <form className="view" onSubmit={this.submitClicked}>
            <div className="imgRow viewDiv">Username:
              <input type= "text" key="username" autoFocus='true' value={this.state.triedUser} onChange={this.updateUser.bind(this)}/></div>

            <div className="imgRow viewDiv">Password:
              <input type= "password" value={this.state.triedPass} onChange={this.updatePass.bind(this)}/></div>

            <div className="imgRow viewDiv"><Button type="submit" bsStyle="success" onClick={this.submitClicked}>submit</Button></div>
            <div className={messageClass}>{message}</div>
        </form>
      </div>
    );
    }
}

export default Login;
