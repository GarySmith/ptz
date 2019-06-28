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
  updateUserSearch(evt) {
    this.setState({searchedUser : evt.target.value});
  }
  updateBox(evt) {
    let oppAdmin = !this.state.searchAdmin;
    this.setState({searchAdmin : oppAdmin});
  }
  updateDisplayName(evt) {
    this.setState({displayName : evt.target.value});
  }
  updateSessionDuration(evt) {
    this.setState({sessionDuration : evt.target.value});
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

  submitClicked = (evt) => {
    let passLen = this.state.password.length;
    let displayLen = this.state.displayName.length;
    
    if((passLen === 1 || passLen === 2) || displayLen === 1 || displayLen === 2) {
      this.setState({errorMessage: "Please make sure all entries are at least 3 characters long"});
    }
    else if(this.state.passConfirm !== this.state.password) {
      this.setState({errorMessage: "Passwords don't match"});
    } 
    else if(this.state.sessionDuration < 1) {
      this.setState({errorMessage: "Session duration has to be one day or longer"});
    }
    else {
      if(passLen>2) {
        this.changeUserPassword();
      }
      if(displayLen>2) {
        this.changeDisplayName();
      }
      this.changeSessionDuration();
      this.changeUserRole();
    }
  }
    
  changeUserPassword() {
      if(this.state.isAdmin) {
        const body = JSON.stringify({password: this.state.password});
        doFetch('api/users/' + this.state.searchedUser + '/password', 'POST', body)
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
  changeUserRole() {
     let dbRole;
     doFetch('api/users/' + this.state.searchedUser, 'GET')
        .then(response => {dbRole = response.admin}).catch((error)=> {});
     if(dbRole===this.state.searchAdmin) return;

     const body = JSON.stringify({user: this.state.searchedUser});
     doFetch('api/users/' + this.state.searchedUser + '/settings', 'POST', body)
        .then(response => {
          this.setState({errorMessage: 'Changed settings successfully for ' + this.state.searchedUser + '!'});
         })
        .catch((error) => {
          this.setState({errorMessage: 'Failed to change settings for ' + this.state.searchedUser});
        })
  }
    
  changeDisplayName() {
      if(this.state.isAdmin) {
        const body = JSON.stringify({display_name: this.state.displayName});
        doFetch('api/users/' + this.state.searchedUser + '/display', 'POST', body)
            .then(response => {
            this.setState({errorMessage: 'Changed display name successfully for ' + this.state.searchedUser + '!'});
            })
            .catch((error) => {
            this.setState({errorMessage: 'Failed to change display name'});
            })
      }
      else {
        const body = JSON.stringify({display_name: this.state.displayName});
        doFetch('api/users/display', 'POST', body)
            .then(response => {
            this.setState({errorMessage: 'Changed your display name successfully!'});
            })
            .catch((error) => {
            this.setState({errorMessage: 'Failed to change your display name'});
            })
      }
  }
  changeSessionDuration() {

  }
  searchClicked = (evt) => {
    doFetch('api/users/' + this.state.searchedUser, 'GET')
        .then(response => {
          this.setState({errorMessage: '', hasSearchedUser: true, searchAdmin: response.admin});
         })
        .catch((error) => {
          this.setState({errorMessage: 'User does not exist', hasSearchedUser: false});
        })
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
            <div><Checkbox inline onChange={this.updateBox.bind(this)} checked = {this.state.searchAdmin}>Admin User</Checkbox></div>
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
    if(this.state.errorMessage[0] === 'C') {
        messageClass = "success";
    }
    else { 
        if(this.state.errorMessage.length > 0) messageClass = "error";
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
        <div className={messageClass}>{this.state.errorMessage}</div>
      </div>
    );
  }
}
export default ManageAccount;
