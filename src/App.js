import React, { Component } from 'react';
import Cookies from 'universal-cookie';
//import logo from './logo.svg';
import './App.css';
import Login from './Login.js';
import Address from './Address.js';
import Calibrate from './Calibrate.js';
import Update from './Update.js';
import jwt from 'jsonwebtoken';
import { doFetch } from './RestUtils.js';
import ReactTimeout from 'react-timeout';
import ManageAccount from './ManageAccount.js';
import AddUser from './AddUser.js';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
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
      dropDown: false,
    };
  }

  componentDidMount = () => {
    this.initialLoadPresets();
    this.checkLogin();
  }
  componentWillUnmount = () => {
      this.cancelPolling();
  }

  presetClicked = (num) => {
    if(!this.state.validLogin) {
      return;
    }
    this.cancelPolling();
    this.setState({currentPreset: num, pending: true});

    doFetch('/api/current_preset', "POST", JSON.stringify({current_preset: num}))
    .then(response => {
      this.setState({pending: false});
      this.startPolling();
    })
    .catch(error => {
      let newState = {pending: false};
      if (error.status === 401 || error.status === 403) {
        newState.currentView = 'login';
        newState.validLogin = false;
        newState.username = false;
        newState.display_name = false;
        newState.admin = false;
      }
      this.setState(newState);
    });
  }

  checkLogin = () => {
    const cookies = new Cookies();
    let token = cookies.get('token');
    let decode = jwt.decode(token);
    if(token) {
      this.onSuccess(decode.user, decode.name, decode.admin);
    }
  }

  initialLoadPresets = () => {
    console.log("initial fetch");
    doFetch('/api/presets', 'GET')
    .then(response => {
      this.setState({
        presets: response,
        currentView: 'home',
      });
      return doFetch('/api/current_preset', 'GET')
    })
    .then(response => {
      this.setState({currentPreset: response.current_preset});
      console.log("Succeeded in getting current_preset, repeating every 5 seconds");
      this.startPolling();
    })
    .catch(error => {
      console.log("Unable to obtain presets");
    })
  }

  startPolling = () => {
    console.log('Starting polling');
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => {
      if(this.state.currentView !== 'home') {
        // Avoid querying for presets when showing other pages
        return;
      }
      console.log("Polling for preset");
      doFetch('/api/current_preset', 'GET')
      .then(response => {
        console.log("Current preset: " + response.current_preset);
        this.setState({currentPreset: response.current_preset});
      })
      .catch(error => {
        console.log("Cancelling polling. Error polling for current position " + error);
        this.cancelPolling();
      });
    }, 5000);
  }

  cancelPolling = () => {
    console.log('Cancelling polling');
    clearInterval(this.interval);
  }

  onSuccess = (username, display_name, admin) => {
    this.setState({currentView: 'home', username: username, validLogin: true, display_name: display_name, admin: admin});
    console.log("success here");
  }

  logoutClicked = () => {
    const cookies = new Cookies();
    cookies.remove('token', { path: '/' });
    this.setState({validLogin: false, username: '', admin: false, display_name: '', currentView: 'home', dropDown: false});
  }


//render function----------------
  render() {
    let menuclass="sidenav";
    if(this.state.expanded) {
      menuclass+=" expanded";
    }


    let credentialsMenu;
    let settingsMenu;
    let calibrateMenu;
    let updateMenu;
    let homeMenu;
    let aboutMenu;
    let presets_len = this.state.presets.length;
    let manageAccount;
    let addUser;

    if(this.state.currentView==='home') {
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
            <img src={process.env.PUBLIC_URL + e.image_url} alt="" className={cls} onClick={() => this.presetClicked(e.num)}/>
            <div className="imgNumbers">{e.num}</div>
          </div>
        </div>
      )
      });
      homeMenu = (
          <center>
          <div>
              {buttons}
           </div>
          </center>
      );
    }
    else if(this.state.currentView==="about") {
      aboutMenu = (<center> <div className={aboutMenu}>Copyright Gary Smith and Holly Donis 2018</div></center>);
    }
    else if(this.state.currentView==='login') {
      credentialsMenu = (<Login onSuccess={this.onSuccess}/>);
    }
    else if(this.state.currentView==="settings") { //change Address class to Settings
      // TODO: This looks problematic. It may possibly trigger multiple timers
      settingsMenu = (<Address onComplete={this.initialLoadPresets}/>); //only admin
    }
    else if(this.state.currentView==='calibrate') {
      calibrateMenu = (<Calibrate num_presets={presets_len} admin={this.state.admin} onComplete={this.initialLoadPresets}/>);  //only admin
    }
    else if(this.state.currentView==='update') {
      updateMenu = (<Update admin={this.state.admin}/>);  //only admin
    }
    else if(this.state.currentView==='manageAccount') {
      manageAccount = (<ManageAccount admin={this.state.admin}/>);
    }
    else if(this.state.currentView==='addUser') {
      addUser = (<AddUser admin={this.state.admin}/>);
    }

    let welcomeMessage = "";
    if(this.state.validLogin) {
      welcomeMessage = "Hello, " + this.state.display_name;
    }
    let userOptions = "options hidden";
    let adminOptions= "options hidden";
    let loginView = "options";
    if(this.state.admin) {
      adminOptions="options";
    }
    if(this.state.validLogin) {
      loginView = "options hidden";
      userOptions= "options";
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
            <div className={loginView} onClick={()=> this.sideButtonClicked("login")}>Login</div>

            <div className={userOptions} onClick={()=> this.sideButtonClicked("manageAccount")}>Manage Account</div>
            <div className={adminOptions} onClick={()=> this.sideButtonClicked("addUser")}>Add User</div>
            <div className={userOptions} onClick={()=> this.logoutClicked()}>Logout</div>

          </div>
          <span className="hamburger" onClick={(e) => this.openNav(e)}>&#9776;</span>
          <div className="title">PTZ Cam App</div>
          <div className="usermenu" onClick={this.iconClicked}>{welcomeMessage}</div>
        </div>
        <div className="middleView">
          {homeMenu}
          {aboutMenu}
          {credentialsMenu}
          {settingsMenu}
          {calibrateMenu}
          {updateMenu}
          {manageAccount}
          {addUser}
        </div>
      </div>
    );
  }

//  end render function----------------------------------------

iconClicked = () => {
  if(this.state.dropDown) {
    this.setState({dropDown: false});
  }
  else {
    if(this.state.validLogin) {
      this.setState({dropDown: true});
    }
  }
}

  closeNav() {
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
export default ReactTimeout(App);
