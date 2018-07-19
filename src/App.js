import React, { Component } from 'react';
import Cookies from 'universal-cookie';
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
      currentView: 'home',
      pending: false,
      username: '',
      validLogin: false,
      admin: false,
      display_name: '',
    };
  }

  componentDidMount = () => {
   console.log("components mounted");
    this.loadPresets();
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
      credentials: "same-origin",
     body: JSON.stringify({current_preset: num})
   };

   fetch('/api/current_preset', post)
   .then(response => response.json())
   .then(response => {
     console.log("updated!");
    this.setState({pending: false});
    })
  }

  loadPresets = () => {
    console.log("presets loaded");
    const init = {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      credentials: "same-origin",
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
    this.setState({currentView: 'home'});
  }


  onSuccess = (username, display_name, admin) => {
    this.setState({currentView: 'home', username: username, validLogin: true, display_name: display_name, admin: admin});
  }

  logoutClicked = () => {
    const cookies = new Cookies();
    cookies.remove('token', { path: '/' });
    this.setState({walidLogin: false, username: '', admin: false, display_name: '', currentView: 'home'});
  }


//render function----------------
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
    let settingsMenu;
    let calibrateMenu;
    let updateMenu;
    let homeMenu= "home hidden";
    let aboutMenu = "about hidden";
    let presets_len = this.state.presets.length;

    if(this.state.currentView==='home') {
      homeMenu= "home";
    }
    else if(this.state.currentView==="about") {
      aboutMenu="about";
    }
    if(this.state.currentView==='account') { //change Login class to Account
      credentialsMenu = (<Login onSuccess={this.onSuccess}/>);
    }
    else if(this.state.currentView==="settings") { //change Address class to Settings
      settingsMenu = (<Address admin={this.state.admin}/>); //only admin
    }
    else if(this.state.currentView==='calibrate') {
      calibrateMenu = (<Calibrate num_presets={presets_len} admin={this.state.admin} onComplete={this.loadPresets}/>);  //only admin
    }
    else if(this.state.currentView==='update') {
      updateMenu = (<Update admin={this.state.admin}/>);  //only admin
    }

    let welcomeMessage = "";
    let logout = "logout hidden";
    if(this.state.validLogin) {
      welcomeMessage = "Hello, " + this.state.display_name;
      logout = "logout";
    }

    let userOptions = "options hidden";
    let adminOptions= "options hidden";
    if(this.state.admin) {
      adminOptions="options";
    }
    if(this.state.validLogin) {
      userOptions = "options";
    }
    return (
      <div>
        <div className="topBar">
          <div key="sideId" className={menuclass}>
            <div className="closebtn" onClick={() => this.closeNav()}> &times;</div>
            <div className="options" onClick={()=> this.sideButtonClicked("home")}>Home</div>
            <div className={adminOptions} onClick={()=> this.sideButtonClicked("settings")}>Settings</div>
            <div className={adminOptions} onClick={()=> this.sideButtonClicked("calibrate")}>Calibrate</div>
            <div className={adminOptions} onClick={()=> this.sideButtonClicked("update")}>Update/Upload Image</div>
            <div className="options" onClick={()=> this.sideButtonClicked("about")}>About</div>
            <div className="options" onClick={()=> this.sideButtonClicked("account")}>Account</div>

          </div>
        </div>
        <div className="title">PTZ Camera App</div>
        <div className="username">
          <div className="welcomeMessage">{welcomeMessage}</div>
          <div className={logout} onClick={this.logoutClicked}>Logout</div>
        </div>
        <span onClick={(e) => this.openNav(e)}>&#9776;</span>
        <center>
          <div className={homeMenu}>
            {buttons}
          </div>
        </center>
       <center> <div className={aboutMenu}>Copyright Gary Smith and Holly Donis 2018</div></center>
        {credentialsMenu}
        {settingsMenu}
        {calibrateMenu}
        {updateMenu}
      </div>
    );
  }

//  end render function----------------------------------------

closeNav() {//false
    this.setState({expanded: false});
  }
  openNav() {
    this.setState({expanded: true});
  }
  sideButtonClicked(str) {
    this.closeNav();
    this.setState({currentView:str});
  }
}

export default App;
