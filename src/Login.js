import React, { Component } from 'react';
import { doFetch } from './RestUtils.js'


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
    let attemptedPassword = this.state.triedPass;
    console.log('submit clicked');
    const body = JSON.stringify({username: attemptedUsername, password: attemptedPassword});
    doFetch('/api/login', 'POST', body)
    .then(response => {
        this.setState({success: true, attempts: 1});
        this.props.onSuccess(attemptedUsername, response.display_name, response.admin);
        //document.cookie = 'token=...; path=/';
      })
    .catch((error)=> {
      console.log(error);
      this.setState({success: false, attempts: 1});
    });
  }

  updateUser(evt) {
    this.setState({triedUser: evt.target.value});
  }
  updatePass(evt) {
    this.setState({triedPass: evt.target.value});
  }
  logout = () => {

  }
  render() {
    let loginClass="";
    if(this.state.success) {
      loginClass="loginForm hidden";
    } else {
       let loginClass="loginForm";
    }

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
        <div className={loginClass}>
        <div className="header">Login</div>
        <form className="view" onSubmit={this.submitClicked}>
            <div className="imgRow viewDiv">Username:
              <input type= "text" key="username" autoFocus='true' value={this.state.triedUser} onChange={this.updateUser.bind(this)}/></div>

            <div className="imgRow viewDiv">Password:
              <input type= "password" value={this.state.triedPass} onChange={this.updatePass.bind(this)}/></div>

            <div className="imgRow viewDiv"><button key="submit" onClick={this.submitClicked}>submit</button></div>
            <div className={messageClass}>{message}</div>
        </form>
        </div>
      </div>
    );
    }
}

export default Login;
