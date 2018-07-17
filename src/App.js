import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

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

  class Address extends Component {
    constructor(props) {
      super(props);
        this.state= {
          addressInput: '128.0.0.0',
          portInput: '50',
          disableAdd: false,
          disablePort: false,
        };
    }
    componentDidMount = () => {
      const init = {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        }
      };

      fetch('/api/camera', init)
      .then(response => response.json())
      .then(response => {
        this.setState({addressInput: response.ip_address, portInput: response.ptz_port});
      })
   }

    updateAddressInput(evt) {
       const IPV4ADDRESS = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
       const val = evt.target.value;
       this.setState({addressInput: val});
       console.log("changed add: "+ val);
       if(IPV4ADDRESS.exec(val)===null) {
        this.setState({disableAdd:true}); //IP address is invalid, so disable button
       }
       else { //IP address is valid, enable button
        this.setState({disableAdd:false});
       }
    }
    updatePortInput(evt) {
       const val = evt.target.value;
       this.setState({portInput: val});
       console.log("changed port: "+ val);
       if(0 < val && val < 65536) {  //if port number is between 1 and 65536, set disable button to false (enable button)
        this.setState({disablePort: false});
       }
       else {   //if port number is less than 0 or greater than 65535, disable button
          this.setState({disablePort: true});
       }
    }
    submit() {
      let address = this.state.addressInput;
      console.log("address = " + address);

      let port = this.state.portInput;
      console.log("port= "+ port);

        const post = {
          method: 'POST',
          headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          },
          body: JSON.stringify({ip_address: address, ptz_port: port})
       };
       fetch('/api/camera', post)
      .then(response => response.json())
      .then(response => {
         console.log("sent ip and port to api");
      })
    }

    render() {
      let disableButton = this.state.disablePort || this.state.disableAdd;
      return (
      <div>
        <div className="header">Camera IP Address</div>
        <div className="view">

          <div className="imgRow viewDiv">IP Address:<input type= "text" key="newAddress"
            value={this.state.addressInput} onChange={this.updateAddressInput.bind(this)}></input></div>

          <div className="imgRow viewDiv">PTZ Port:<input type= "text" key="newPort"
            value={this.state.portInput} onChange={this.updatePortInput.bind(this)}></input></div>

          <div className="imgRow viewDiv">
            <button key="addressButton" disabled={disableButton} onClick={() => this.submit()}>Enter</button></div>

        </div>
      </div>
    );
   }
}

class Calibrate extends Component {
  constructor(props) {
    super(props);
    this.state= {
      presets: [],
      message: '',
    };
  }
  calibrate() {
    const init = {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      }
    };

    fetch('/api/calibrate', init)
    .then(response => response.json())
    .then(response => {
      this.setState({presets: response});
      this.setState({message: 'Calibrate Clicked!'});
    });
   }
   render() {
      let buttons;
    /*const buttons = this.state.presets.map(e => (
      <div key={e.num} className='imgRow'>
        <div className="imgCol">
          <div className="presetImgs text">{e.num}</div>
          <img src={process.env.PUBLIC_URL + e.image_url} className="presetImgs" onClick={this.presetClicked}/>
        </div>
      </div>
    ));*/
    return (
      <div>
        <div className="header">Calibrate</div>
        <div className="view">
           <div className="imgRow viewDiv">Calibrate:</div>
           <div className="imgRow viewDiv"><button onClick={()=>this.calibrate()}>submit</button></div>
           {buttons}
           {this.state.message}
        </div>
      </div>
    );
   }
}

class Update extends Component {
  constructor(props) {
    super(props);
  }
  render() {
   return (
      <div>
        <div className="header">Update/Upload Image</div>
        <div className="view">
          <div className="imgRow viewDiv">Pick the image number to upload or update: <input type= "text"/></div>
          <div className="imgRow viewDiv">
            Image: <input type= "text" key="imgName"/>
            <button key="submit">submit</button>
           </div>
        </div>
      </div>
    );
   }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state={
      expanded: false,
      presets : [],
      currentPreset: -1,
      header: "",
      showCredentials: false,
      showAddress: false,
      showCalibrate: false,
      showUpdate: false,
      showHome: false,
      showAbout: false,
      pending: false,
      username: '',
    };

    this.hasServer = true;
  }

  componentDidMount = () => {
    if (this.hasServer) {
      const init = {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        }
      };

      fetch('/api/presets', init)
      .then(response => response.json())
      .then(response => {
        this.setState({presets: response});
        return fetch('/api/current_preset', init)
      })
      .then(response => response.json())
      .then(response => {
        console.log('current '+response.current_preset);
        this.setState({currentPreset: response.current_preset});
      })
    } else {
      this.setState({presets: [{
          "num": 1,
          "image_url": "/images/1.jpg",
        },{
          "num": 2,
          "image_url": "/images/2.jpg",
        }]});
    }
  }

  presetClicked = (num) => {
    console.log(num);
    this.setState({currentPreset: num, pending: true});
    const post = {
     method: 'POST',
     headers: {
       'Accept': 'application/json, text/plain, */*',
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({current_preset: num})
   };

   fetch('/api/current_preset', post)
   .then(response => response.json())
   .then(response => {
     console.log("updated!");
    this.setState({pending: false});
    })
  }

  onSuccess = (username) => {
    console.log("this.onSuccess here");
    this.setState({username: username});
  }
  render() {
    let menuclass="sidenav";
    if(this.state.expanded) {
      menuclass+=" expanded";
    }

    const buttons = this.state.presets.map(e => {
      let cls="presetImgs";
      if (e.num == this.state.currentPreset) {
        if(this.state.pending) {
          cls+=" pending";
        } else {
          cls+= " selectedImg";
        }
      }

      return (
      <div key={e.num} className='imgRow'>
        <div className="imgCol">
          <div className="imgNumbers">{e.num}</div>
          <img src={process.env.PUBLIC_URL + e.image_url} className={cls} onClick={() => this.presetClicked(e.num)}/>
        </div>
      </div>
    )
    });

    let credentialsMenu;
    let addressMenu;
    let calibrateMenu;
    let updateMenu;
    let homeMenu;
    let aboutMenu = "about hidden";

    if(this.state.showCredentials) {
      credentialsMenu = (<Login onSuccess={this.onSuccess}/>);
      homeMenu = "home hidden";
      aboutMenu = "about hidden";
    }
    else if(this.state.showAddress) {
      addressMenu = (<Address />);
      homeMenu = "home hidden";
      aboutMenu = "about hidden";
    }
    else if(this.state.showCalibrate) {
      calibrateMenu = (<Calibrate />);
      homeMenu = "home hidden";
      aboutMenu = "about hidden";
    }
    else if(this.state.showUpdate) {
      updateMenu = (<Update />);
      homeMenu = "home hidden";
      aboutMenu = "about hidden";
    }
    else if(this.state.showHome) {
      homeMenu = "home";
      aboutMenu = "about hidden";
    } else if(this.state.showAbout) {
      homeMenu = "home hidden";
      aboutMenu = "about";
    }

    let welcomeMessage = "";
    if(this.state.username!="") {
      welcomeMessage = "Hello, " + this.state.username;
    }
    return (
      <div>
        <div className="topBar">
          <div key="sideId" className={menuclass}>
            <a href="javascript:void(0)" className="closebtn" onClick={() => this.closeNav()}> &times;</a>
            <a href="#" onClick={()=> this.sideButtonClicked("login")}>Login</a>
            <a href="#" onClick={()=> this.sideButtonClicked("address")}>Camera IP Address</a>
            <a href="#" onClick={()=> this.sideButtonClicked("calibrate")}>Calibrate</a>
            <a href="#" onClick={()=> this.sideButtonClicked("update")}>Update/Upload Image</a>
            <a href="#" onClick={()=> this.sideButtonClicked("home")}>Home</a>
            <a href="#" onClick={()=> this.sideButtonClicked("about")}>About</a>

          </div>
        </div>
        <div className="title">PTZ Camera App &#9925;</div>
        <div className="username">{welcomeMessage}</div>
        <span onClick={(e) => this.openNav(e)}>&#9776;</span>
        <center>
          <div className={homeMenu}>
            {buttons}
          </div>
        </center>
       <center> <div className={aboutMenu}>Copyright Gary Smith and Holly Donis 2018</div></center>
        {credentialsMenu}
        {addressMenu}
        {calibrateMenu}
        {updateMenu}
      </div>
    );
  }
  closeNav() {//false
    this.setState({expanded: false});
  }
  openNav() {
    this.setState({expanded: true});
  }
  sideButtonClicked(str) {
    this.closeNav();
    if(str=="login") {
      this.setState({showCredentials: true});
      this.setState({showHome: false});
      this.setState({showAddress: false});
      this.setState({showCalibrate: false});
      this.setState({showUpdate: false});
    }
    else if(str=="address") {
      this.setState({showAddress: true});
      this.setState({showCredentials: false});
      this.setState({showHome: false});
      this.setState({showCalibrate: false});
      this.setState({showUpdate: false});
    }
    else if(str=="calibrate") {
      this.setState({showCalibrate: true});
      this.setState({showHome: false});
      this.setState({showAddress: false});
      this.setState({showCredentials: false});
      this.setState({showUpdate: false});
    }
    else if(str=="update") {
      this.setState({showUpdate: true});
      this.setState({showHome: false});
      this.setState({showCredentials: false});
      this.setState({showAddress: false});
      this.setState({showCalibrate: false});
    }
    else if(str=="home" || str=="about") {
      this.setState({showHome: true});
      this.setState({showCredentials: false});
      this.setState({showAddress: false});
      this.setState({showCalibrate: false});
      this.setState({showUpdate: false});
      if(str=="about") {
        this.setState({showHome: false});
        this.setState({showAbout: true});
      }
    }
  }
}

export default App;
