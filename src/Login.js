import React, { Component } from 'react';

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
  submitClicked() {
    let attemptedUsername = this.state.triedUser;
    let attemptedPassword = this.state.triedPass;

    const post = {
      method: 'POST',
      headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      },
      body: JSON.stringify({username: attemptedUsername, password: attemptedPassword})
    };
    fetch('/api/login', post)
    .then(response => response.json())
    .then(response => {
        console.log("sent ip and port to api");
        this.setState({success: true});
        this.setState({attempts: 1});
        this.props.onSuccess(attemptedUsername);
      })
    .catch((error)=> {
      console.log(error);
      console.log("login and username were invalid: " + attemptedUsername +", " +attemptedPassword);
      this.setState({success: false});
      this.setState({attempts: 1});
    });
  }

  updateUser(evt) {
    this.setState({triedUser: evt.target.value});
  }
  updatePass(evt) {
    this.setState({triedPass: evt.target.value});
  }

  render() {
    let message = "";
    let messageClass='imgRow viewDiv';
    if(this.state.success) {
      messageClass='imgRow viewDiv green';
      message = "Welcome user!";
      console.log("here");
    }
    else if(this.state.attempts>0){
      message = "Login failed.";
      messageClass ='imgRow viewDiv red';
      console.log("bad");
    }
    return (
      <div>
        <div className="header">Login</div>
        <div className="view">
            <div className="imgRow viewDiv">Username: <input type= "text" key="username" value={this.state.triedUser} onChange={this.updateUser.bind(this)}/></div>
            <div className="imgRow viewDiv">Password: <input type= "password" value={this.state.triedPass} onChange={this.updatePass.bind(this)}/></div>
            <div className="imgRow viewDiv"><button key="submit" onClick={() => this.submitClicked()}>submit</button></div>
            <div className={messageClass}>{message}</div>
        </div>
      </div>
    );
    }
}

export default Login;
