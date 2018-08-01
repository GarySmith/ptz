import React, { Component } from 'react';
import { doFetch } from './RestUtils.js';
import { FormGroup } from 'react-bootstrap';
import { FormControl } from 'react-bootstrap';
import { ControlLabel } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import { Checkbox } from 'react-bootstrap';

class AddUser extends Component {
  constructor(props) {
    super(props);
    this.state={
      username : '',
      displayname : '',
      password : '',
      passConfirm: '',
      errorMessage: '',
      admin: false,
    };
  }
  updateUser(evt) {
    this.setState({username : evt.target.value});
  }
  updateDisplay(evt) {
    this.setState({displayname : evt.target.value});
  }
  updatePassword(evt) {
    this.setState({password : evt.target.value});
  }
  updatePassConfirm(evt) {
    this.setState({passConfirm : evt.target.value});
  }
  submitClicked = (evt) => {
    if(this.state.username.length<3 || this.state.displayname.length<3 || this.state.password.length<3) {
      this.setState({errorMessage: "Please make sure all entries are at least 3 characters long"});
    }
    else if(this.state.passConfirm !== this.state.password) {
      this.setState({errorMessage: "Passwords don't match"});
    }
    else {
      const body = JSON.stringify({username: this.state.username,
        password: this.state.password, admin: this.state.admin, display_name: this.state.displayname});
      doFetch('api/users', 'POST', body)
        .then(response => {
          this.setState({errorMessage: 'User added successfully!'});
        })
        .catch((error) => {
          this.setState({errorMessage: 'Failed to add user'});
        })
    }
  }
  getValidationState = (str) => {
    let len;
    if(str==="username") {
      len = this.state.username.length;
    }
    else if(str==="display") {
      len=this.state.displayname.length;
    }
    else if(str==="password") {
      len=this.state.password.length;
    }
    else {
      len=this.state.passConfirm.length;
      if(len === 0) { return null; }
      else if(len !== this.state.password.length) { return 'error'; }
    }
    if(len > 2) {
      return 'success';
    } else if(len > 0) { return 'error';}
     return null;
  }
  updateBox(evt) {
    this.setState({admin: evt.target.checked});
  }

  render() {
    let adminMessage = "You can add users if you upgrade your account to admin. Only $14.99 per month. Contact Gary Smith for more details and a chance to have more camera freedom."
    let messageClass;
    if(this.state.errorMessage==='') {
      messageClass='';
    }
    else if(this.state.errorMessage==='User added successfully!') {
      messageClass="success";
    } else {
      messageClass="error";
    }
    let adminDiv;
    if(this.props.admin) {
      adminMessage = '';
      adminDiv = (
          <div className="addUser">
            <div className="header">Add Users</div>
            <form onSubmit={this.submitClicked}>
              <FormGroup controlId="formBasicText" validationState={this.getValidationState("username")}>
                <ControlLabel>Username</ControlLabel>
                <FormControl type="text" value={this.state.username} placeholder="Enter username" onChange={this.updateUser.bind(this)} />
                <FormControl.Feedback />
              </FormGroup>
              <FormGroup controlId="formBasicText" validationState={this.getValidationState("display")}>
                <ControlLabel>Display Name</ControlLabel>
                <FormControl type="text" value={this.state.displayname} placeholder="Enter first and last name" onChange={this.updateDisplay.bind(this)} />
                <FormControl.Feedback />
              </FormGroup>
              <FormGroup controlId="formBasicText" validationState={this.getValidationState("password")}>
                <ControlLabel>Password</ControlLabel>
                <FormControl type="text" value={this.state.password} placeholder="Enter password" onChange={this.updatePassword.bind(this)} />
                <FormControl.Feedback />
              </FormGroup>
              <FormGroup controlId="formBasicText" validationState={this.getValidationState("confirmPass")}>
                <ControlLabel>Confirm Password</ControlLabel>
                <FormControl type="text" value={this.state.passConfirm} placeholder="Enter password" onChange={this.updatePassConfirm.bind(this)} />
                <FormControl.Feedback />
              </FormGroup>
              <div><Checkbox inline onChange={this.updateBox.bind(this)}>Admininstrative User</Checkbox></div><p></p>
              <Button bsStyle="success" onClick={this.submitClicked}>Submit</Button>
            </form>
            <div className={messageClass}>{this.state.errorMessage}</div>
        </div>
      );
    }

    return(
      <div>
        <center><div>{adminMessage}</div></center>
        {adminDiv}
      </div>
    );
  }
}
export default AddUser;
