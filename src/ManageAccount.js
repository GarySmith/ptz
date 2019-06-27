import React, { Component } from 'react';
import { doFetch } from './RestUtils.js';
import { FormGroup } from 'react-bootstrap';
import { FormControl } from 'react-bootstrap';
import { ControlLabel } from 'react-bootstrap';
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
      userRole: '',
      errorMessage: '',
      hasSearchedUser : false,
      searchedUser: '',
      displayName: '',
      sessionDuration: 1,
      searchAdmin : false,
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
  updateUserSearch(evt) {
    this.setState({searchedUser : evt.target.value});
  }
  updateBox(evt) {
    this.setState({searchAdmin : evt.target.value});
  }
  updateDisplayName(evt) {
    this.setState({displayName : evt.target.value});
  }
  updateSessionDuration(evt) {
    this.setState({sessionDuration : evt.target.value});
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
    else if(str==="session") {
        if(this.state.sessionDuration<1) return 'error';
        else return null;
    }
    else if(str==="searchedUser") {
        len = this.state.searchedUser.length;
    }
    else if(str==="displayName") {
        len = this.state.displayName.length;
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
        this.setState({hasSearchedUser: true});
  }

  render() {
    let messageClass='';
    let changeRoleFormGroup;
    let searchUserForm;
    let usernameLabel;
    let passwordFormGroup;
    let confirmPasswordFormGroup;
    let displayFormGroup;   
    let sessionFormGroup;
    let submitButton;
  
    if(this.state.isAdmin) {
        if(this.state.hasSearchedUser) {
          usernameLabel = <ControlLabel>Username: {this.state.searchedUser}</ControlLabel>
          changeRoleFormGroup =
            <div><Checkbox inline onChange={this.updateBox.bind(this)}>Admin User</Checkbox></div>
          sessionFormGroup = 
            <FormGroup controlId="formBasicText" validationState={this.getValidationState("session")}>
              <ControlLabel>Edit session duration (in days) </ControlLabel>
              <FormControl type="number" value={this.state.sessionDuration} onChange={this.updateSessionDuration.bind(this)} />
              <FormControl.Feedback />
            </FormGroup>
        }
        else {
          searchUserForm = <form onSubmit={this.searchClicked}> 
            <FormGroup controlId="formBasicText" validationState={this.getValidationState("searchedUser")}><ControlLabel>Search for a user</ControlLabel>
            <FormControl type="text" value={this.state.searchedUser} placeholder="Enter username" onChange = {this.updateUserSearch.bind(this)} />
            <FormControl.Feedback /></FormGroup>
            <Button bsStyle="success" onClick={this.searchClicked}>Submit</Button>
          </form>
        }
     } 
     if(this.state.hasSearchedUser || !this.state.isAdmin) {
        passwordFormGroup = 
          <FormGroup controlId="formBasicText" validationState={this.getValidationState("password")}>
            <ControlLabel>New Password</ControlLabel>
            <FormControl type="text" value={this.state.password} placeholder="Enter new password" onChange={this.updatePassword.bind(this)} />
            <FormControl.Feedback />
          </FormGroup>

        confirmPasswordFormGroup = 
          <FormGroup controlId="formBasicText" validationState={this.getValidationState("confirmPass")}>
            <ControlLabel>Confirm New Password</ControlLabel>
            <FormControl type="text" value={this.state.passConfirm} placeholder="Enter new password" onChange={this.updatePassConfirm.bind(this)} />
            <FormControl.Feedback />
          </FormGroup>
       
         displayFormGroup = 
          <FormGroup controlId="formBasicText" validationState={this.getValidationState("displayName")}>
            <ControlLabel>Change display name</ControlLabel>
            <FormControl type="text" value={this.state.displayName} placeholder="Enter new display name" onChange={this.updateDisplayName.bind(this)} />
            <FormControl.Feedback />
          </FormGroup>
          
          submitButton = <Button bsStyle="success" onClick={this.submitClicked}>Submit</Button>
     }
    
    return (
      <div className="addUser">
        <div className="header">Manage Account</div>
        {searchUserForm} 
        <form onSubmit={this.submitClicked}>
          {usernameLabel}
          {displayFormGroup}
          {passwordFormGroup}
          {confirmPasswordFormGroup}
          {sessionFormGroup}
          {changeRoleFormGroup}<p></p> 
          {submitButton}
        </form>
        <div className={messageClass}>{this.state.errroMessage}</div>
      </div>
    );
  }
}
export default ManageAccount;
