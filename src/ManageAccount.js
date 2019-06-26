import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import jwt from 'jsonwebtoken';
import { doFetch } from './RestUtils.js';
import { FormGroup } from 'react-bootstrap';
import { FormControl } from 'react-bootstrap';
import { ControlLabel } from 'react-bootstrap';
import { HelpBlock } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import { Checkbox } from 'react-bootstrap';

class ManageAccount extends Component {
  constructor(props) {
    super(props);
    this.state={
      username: '',
      password: '',
      passConfirm: '',
      isAdmin : false,
    };
  }

  componentDidMount = () => {
    if(this.props.admin) {
     this.setState({isAdmin: true});
    }
  }
  updateUser(evt) {
    this.setState({username : evt.target.value});
  }
  updatePassword(evt) {
    this.setState({password : evt.target.value});
  }
  updatePassConfirm(evt) {
    this.setState({passConfirm : evt.target.value});
  }
  submitClicked = (evt) => {
  //fix submit!!
  
    if((this.state.isAdmin && this.state.username.length<3) || this.state.password.length<3 || this.state.passConfirm<3) {
      this.setState({errorMessage: "Please make sure all entries are at least 3 characters long"});
    }
    else if(this.state.passConfirm!=this.state.password) {
      this.setState({errorMessage: "Passwords don't match"});
    } //confirming old password???
    else {
      if(this.state.isAdmin) {
        const body = JSON.stringify({password: this.state.password});
        doFetch('api/users/' + this.state.username + '/password', 'POST', body)
            .then(response => {
            this.setState({errorMessage: 'Changed password successfully for ' + this.state.username + '!'});
            })
            .catch((error) => {
            this.setState({errorMessage: 'Failed to change password'});
            }) 
      }
      else {
        const body = JSON.stringify({password: this.state.password});
        doFetch('api/password', 'POST', body)
            .then(response => {
            this.setState({errorMessage: 'Changed password successfully!'});
            })
            .catch((error) => {
            this.setState({errorMessage: 'Failed to change password'});
            }) 
      }
    }
  }
  getValidationState = (str) => {
    let len;
    if(str==="username") {
      len = this.state.username.length;
    }
    else if(str==="password") {
      len=this.state.password.length;
    }
    else {
      len=this.state.passConfirm.length;
      if(len==0) { return null; }
      else if(len!=this.state.password.length) { return 'error'; }
    }
    if(len > 2) {
      return 'success';
    } else if(len > 0) { return 'error';}
     return null;
  }
  render() {
    let messageClass='';
    let userTextBox;
    let userLabel;
    if(this.state.isAdmin) {
        userTextBox = 
          <FormControl type="text" value={this.state.username} placeholder="Enter username" onChange={this.updateUser.bind(this)} />
        userLabel = <ControlLabel>Username</ControlLabel>
    }
    return (
      <div className="addUser">
        <div className="header">Manage Account</div>
        <form onSubmit={this.submitClicked}>
          <FormGroup controlId="formBasicText" validationState={this.getValidationState("username")}>
            {userLabel}
            {userTextBox}
            <FormControl.Feedback />
          </FormGroup>
          <FormGroup controlId="formBasicText" validationState={this.getValidationState("password")}>
            <ControlLabel>New Password</ControlLabel>
            <FormControl type="text" value={this.state.password} placeholder="Enter new password" onChange={this.updatePassword.bind(this)} />
            <FormControl.Feedback />
          </FormGroup>
          <FormGroup controlId="formBasicText" validationState={this.getValidationState("confirmPass")}>
            <ControlLabel>Confirm New Password</ControlLabel>
            <FormControl type="text" value={this.state.passConfirm} placeholder="Enter new password" onChange={this.updatePassConfirm.bind(this)} />
            <FormControl.Feedback />
          </FormGroup>
          <Button bsStyle="success" onClick={this.submitClicked}>Submit</Button>
        </form>
        <div className={messageClass}>{this.state.errroMessage}</div>
      </div>
    );
  }
}
export default ManageAccount;
