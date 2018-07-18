import React, { Component } from 'react';
//import logo from './logo.svg';
import './App.css';
import Login from './Login.js';
import Address from './Address.js';
import Calibrate from './Calibrate.js';
import Update from './Update.js';


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
      validLogin: false,
      admin: false,
      display_name: '',
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
  }

  presetClicked = (num) => {
    console.log(num);
    if(!this.state.validLogin) {
      return;
    }
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

  onSuccess = (username, display_name, admin) => {
    this.setState({username: username, validLogin: true, display_name: display_name, admin: admin});
  }
  render() {
    let menuclass="sidenav";
    if(this.state.expanded) {
      menuclass+=" expanded";
    }

    const buttons = this.state.presets.map(e => {
      let cls="presetImgs";
      if (e.num === this.state.currentPreset) {
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
          <img src={process.env.PUBLIC_URL + e.image_url} alt="" className={cls} onClick={() => this.presetClicked(e.num)}/>
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
      addressMenu = (<Address admin={this.state.admin}/>); //only admin
      homeMenu = "home hidden";
      aboutMenu = "about hidden";
    }
    else if(this.state.showCalibrate) {
      calibrateMenu = (<Calibrate admin={this.state.admin}/>);  //only admin
      homeMenu = "home hidden";
      aboutMenu = "about hidden";
    }
    else if(this.state.showUpdate) {
      updateMenu = (<Update admin={this.state.admin}/>);  //only admin
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
    if(this.state.validLogin) {
      welcomeMessage = "Hello, " + this.state.display_name;
    }
    return (
      <div>
        <div className="topBar">
          <div key="sideId" className={menuclass}>
            <div className="closebtn" onClick={() => this.closeNav()}> &times;</div>
            <div className="options" onClick={()=> this.sideButtonClicked("login")}>Login</div>
            <div className="options" onClick={()=> this.sideButtonClicked("address")}>Camera IP Address</div>
            <div className="options" onClick={()=> this.sideButtonClicked("calibrate")}>Calibrate</div>
            <div className="options" onClick={()=> this.sideButtonClicked("update")}>Update/Upload Image</div>
            <div className="options" onClick={()=> this.sideButtonClicked("home")}>Home</div>
            <div className="options" onClick={()=> this.sideButtonClicked("about")}>About</div>

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
    if(str==="login") {
      this.setState({showCredentials: true, showHome: false,
        showAddress: false, showCalibrate: false, showUpdate: false});
    }
    else if(str==="address") {
      this.setState({showAddress: true, showCredentials: false, showHome: false, showCalibrate: false, showUpdate: false});
    }
    else if(str==="calibrate") {
      this.setState({showAddress: false, showCredentials: false, showHome: false, showCalibrate: true, showUpdate: false});
    }
    else if(str==="update") {
      this.setState({showAddress: false, showCredentials: false, showHome: false, showCalibrate: false, showUpdate: true});
    }
    else if(str==="home" || str==="about") {
      this.setState({showAddress: false, showCredentials: false, showHome: true, showCalibrate: false, showUpdate: false});
      if(str==="about") {
        this.setState({showHome: false, showAbout: true});
      }
    }
  }
}

export default App;
