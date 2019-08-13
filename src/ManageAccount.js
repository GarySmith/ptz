import React, { Component } from 'react';
import { doFetch } from './RestUtils.js';
import { FormGroup } from 'react-bootstrap';
import { FormControl } from 'react-bootstrap';
import { ControlLabel } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import { Checkbox } from 'react-bootstrap';
import { Table } from 'react-bootstrap';
import password from './password.js';
import AddUser from './AddUser.js';

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
      userList : [],
      passwordDiv : null,
      addUser : false,
    };
  }

  componentDidMount = () => {
    if(this.props.admin) {
     this.setState({isAdmin: true});
    }
    doFetch('api/users', 'GET')
        .then(response => {
           for(let i = 0; i < response.length; i++) {
             if(response[i].admin) response[i].admin = "yes"
             else response[i].admin = "no"
           }
           this.setState({userList : response});
         })
        .catch((error) => {
          this.setState({errorMessage: 'Unable to display user table', hasSearchedUser: false});
        })
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
      this.updateSettings()
    }
  }

  createHash() {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(this.state.password);
    return (hash.digest('hex'));
  }
  hashPassword(hashed) {
     this.setState({password: hashed});
  }
  updateSettings() {
    let hashedPassword = this.createHash();
    if(this.state.isAdmin) {
      const body = JSON.stringify({user: this.state.searchedUser, admin: this.state.searchAdmin,
                                display_name: this.state.displayName, password: hashedPassword,
                                session: this.state.sessionDuration});
      doFetch('api/users/' + this.state.searchedUser + '/settings', 'POST', body)
        .then(response => {
          this.setState({errorMessage: 'Changed settings successfully for ' + this.state.searchedUser + '!'});
          this.props.onComplete();
          })
        .catch((error) => {
          this.setState({errorMessage: 'Failed to change settings for ' + this.state.searchedUser});
        })
     }
    else {
      const body = JSON.stringify({user: this.state.username,
                             display_name: this.state.displayName, password: hashedPassword});
      doFetch('api/users/settings', 'POST', body)
        .then(response => {
         this.setState({errorMessage: 'Changed settings successfully!'});
          this.props.onComplete();
         })
        .catch((error) => {
          this.setState({errorMessage: 'Failed to change settings'});
        })
     }
  }

  searchClicked = (evt) => {
    evt.preventDefault();
    doFetch('api/users/' + this.state.searchedUser, 'GET')
        .then(response => {
          this.setState({errorMessage: '', hasSearchedUser: true, searchAdmin: response.admin});
         })
        .catch((error) => {
          this.setState({errorMessage: 'User does not exist', hasSearchedUser: false});
        })
  }
  tableRowClicked(evt, user) {
    console.log('table clicked');
    //let username = user.target.innerText;
    let username = evt;
    let adminYesNo = "";
    let sesh_dur = 1;
    for(let i = 0; i < this.state.userList.length; i++) {
      if(this.state.userList[i]["username"]===username) {
        sesh_dur = this.state.userList[i]["session_duration"];
        adminYesNo = this.state.userList[i]["admin"]; break;
      }
    }
    if(adminYesNo === "yes") this.setState({searchAdmin: true});
    else this.setState({searchAdmin: false});
    this.setState({searchedUser: username, errorMessage: '', hasSearchedUser: true, sessionDuration: sesh_dur});
  }
  deleteClicked(user) {
    let userDelete = user.target.id;
    console.log(userDelete);
    const confirmDelete = window.confirm("Do you really want to delete " + user.target.id + "?"); 
    if(!confirmDelete) { return; }
    const body = JSON.stringify({username: userDelete});
     doFetch('api/users/' + userDelete, 'DELETE', body)
        .then(response => {
          this.setState({errorMessage: 'User deleted successfully!'});
          let tempList = [];
          for(let i = 0; i < this.state.userList.length; i++) {
            if(this.state.userList[i]['username'] !== userDelete) {
              tempList.push(this.state.userList[i]);
            }
          }
          this.setState({userList : tempList});
        })
        .catch((error) => {
          this.setState({errorMessage: 'Failed to delete user'});
        })
  }

  createTable() {
    let table =  <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Username</th>
              <th>Display Name</th>
              <th>Session Duration</th>
              <th>Admin?</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
           {this.createUserList()}
          </tbody>
        </Table>
    return table;
  }
  createUserList() {
    let filteredList = [];
    let searchLen = this.state.searchedUser.length;
    for(let i = 0; i < this.state.userList.length; i++) {
      if(this.state.userList[i]["username"].substr(0, searchLen) === this.state.searchedUser) {
        filteredList.push(this.state.userList[i]);
      }
    }
    if(searchLen < 1) {
      filteredList = this.state.userList;
    }
    return filteredList.map((info, index) => {
      const {admin, display_name, session_duration, username} = info
        return (
         <tr key={username} className="tag">
         <td onClick={this.tableRowClicked.bind(this, username)}>{username}</td>
         <td onClick={this.tableRowClicked.bind(this, username)}>{display_name}</td>
         <td onClick={this.tableRowClicked.bind(this, username)}>{session_duration}</td>
         <td onClick={this.tableRowClicked.bind(this, username)}>{admin}</td>
         <td onClick={this.deleteClicked.bind(this)} key={username} id={username} className="error">X</td>
         </tr>
        )
     })
  }
  showAddUser = (evt) => {
    this.setState({addUser: true});
  }
  cancelClicked = (evt) => {
    this.setState({searchedUser : '', hasSearchedUser : false});
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
    let table;
    let tableTest = this.createUserList();
    let addUser;
    let cancelButton;
    let addUserButton;
    
    if(this.state.addUser) {
      return (<AddUser admin={this.state.isAdmin}/>);
    }
    if(this.state.isAdmin) {
        if(this.state.hasSearchedUser) {
          let isYourself = false;
          if(this.state.searchedUser===this.props.username) {
            isYourself = true;
          }
          usernameLabel = <ControlLabel>Username: {this.state.searchedUser}</ControlLabel>
          changeRoleFormGroup =
            <div><Checkbox inline onChange={this.updateBox.bind(this)} disabled={isYourself} checked = {this.state.searchAdmin}>Admin User</Checkbox></div>
          sessionFormGroup =
            <FormGroup controlId="formBasicText" validationState={this.getValidationState("session")}>
              <ControlLabel>Edit session duration (in days) </ControlLabel>
              <FormControl type="number" value={this.state.sessionDuration} onChange={this.updateSessionDuration.bind(this)} />
              <FormControl.Feedback />
            </FormGroup>
            cancelButton = <Button bsStyle="warning" onClick={this.cancelClicked}>Cancel</Button>
        }
        else {
          searchUserForm = <form onSubmit={this.searchClicked}>
            <FormGroup controlId="formBasicText" validationState={this.getValidationState("searchedUser")}><ControlLabel>Search for a user</ControlLabel>
            <FormControl type="text" value={this.state.searchedUser} placeholder="Enter username" onChange = {this.updateUserSearch.bind(this)} />
            <FormControl.Feedback /></FormGroup>
          </form>

           table = this.createTable();
           addUserButton = <Button bsStyle="primary" onClick={this.showAddUser}>+ Add a user</Button>
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
        {table}
        <p></p>
        {addUserButton}
        {cancelButton}
       </div>
    );
  }
}
export default ManageAccount;
