import React, { Component } from 'react';
import { doFetch } from './RestUtils.js';
import { FormGroup } from 'react-bootstrap';
import { FormControl } from 'react-bootstrap';
import { ControlLabel } from 'react-bootstrap';
import { Button } from 'react-bootstrap';

class ManageAccount extends Component {
  constructor(props) {
    super(props);
    this.state={
      username: '',
      password: '',
      passConfirm: '',
      isAdmin : false,
      userRole: '',
      errorMessage: '',
      hasSearchedUser : false,
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
  updateUserRole(evt) {
    this.setState({userRole : evt.target.value});
  }
  submitClicked = (evt) => {
    if((this.state.isAdmin && this.state.username.length<3) || this.state.password.length<3 || this.state.passConfirm<3) {
      this.setState({errorMessage: "Please make sure all entries are at least 3 characters long"});
    }
    else if(this.state.passConfirm!==this.state.password) {
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
    else if(str==="userRole") {
        len = this.state.userRole.length;
    }
    else {
      len=this.state.passConfirm.length;
      if(len===0) { return null; }
      else if(len!==this.state.password.length || this.state.password!==this.state.passConfirm) { return 'error'; }
    }
    if(len > 2) {
      return 'success';
    } else if(len > 0) { return 'error';}
     return null;
  }
  roleChangeClicked = (evt) => {
     const body = JSON.stringify({user: this.state.userRole});
     doFetch('api/users/' + this.state.userRole + '/settings', 'POST', body)
        .then(response => {
          this.setState({errorMessage: 'Changed settings successfully for ' + this.state.userRole + '!'});
         })
        .catch((error) => {
          this.setState({errorMessage: 'Failed to change settings'});
        })
  }
    
  searchClicked = (evt) => {

  }

  render() {
    let messageClass='';
    let userTextBox;
    let userLabel;
    let changeRoleDiv;
    let changeRoleLabel = "";
    let searchUserButton;
    if(this.state.isAdmin) {
        userTextBox =
          <FormControl type="text" value={this.state.username} placeholder="Enter username" onChange={this.updateUser.bind(this)} />
        userLabel = <ControlLabel>Username</ControlLabel>
        changeRoleDiv = <form onSubmit={this.roleChangeClicked}> 
          <FormGroup controlId="formBasicText" validationState={this.getValidationState("userRole")}><ControlLabel>Change user settings from user to admin or admin to user</ControlLabel>
          <FormControl type="text" value={this.state.userRole} placeholder="Enter username" onChange = {this.updateUserRole.bind(this)} />
          <FormControl.Feedback /></FormGroup>
          <Button bsStyle="success" onClick={this.roleChangeClicked}>Submit</Button>
          </form>
        changeRoleLabel = "Change User Role";
        if(!this.state.hasSearchedUser) {
            searchUserButton = <Button bsStyle="success" onClick={this.searchClicked}>Search</Button>
        }
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
        <div className="header">{changeRoleLabel}</div>
        {changeRoleDiv}
      </div>
    );
  }
}
export default ManageAccount;
