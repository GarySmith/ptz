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
  submitClicked = (evt) => {
    evt.preventDefault();
    let attemptedUsername = this.state.triedUser;
    let attemptedPassword = this.state.triedPass;
    console.log('submit clicked');
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
        this.setState({success: true});
        this.setState({attempts: 1});
        this.props.onSuccess(attemptedUsername, response.display_name, response.admin);
        console.log("success: " + attemptedUsername +" " + response.display_name +" "+ response.admin);
      })
    .catch((error)=> {
      console.log(error);
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

            <div className="imgRow viewDiv"><button key="submit" onClick={this.submitClicked}>submit</button></div>
            <div className={messageClass}>{message}</div>
        </form>
      </div>
    );
    }
}

export default Login;
