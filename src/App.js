import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import './App.css';
import Login from './Login.js';
import Settings from './Settings.js';
import UpdatePreset from './UpdatePreset.js';
import jwt from 'jsonwebtoken';
import { doFetch } from './RestUtils.js';
import ReactTimeout from 'react-timeout';
import ManageAccount from './ManageAccount.js';
import FiberManualRecord from '@material-ui/icons/FiberManualRecord';
import PhotoCamera from '@material-ui/icons/PhotoCamera';
import Home from '@material-ui/icons/Home';

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
      snapshotTimestamp: 0,  // time when snapshot taken (-1 == none available)
      recording: null,
    };
  }

  componentDidMount = () => {
    this.initialLoadPresets();
    this.checkLogin();
    doFetch('/api/vlc/is_recording')
    .then(response => {
      this.setState({recording: response});
    })
    .catch(error => {})
  }
  componentWillUnmount = () => {
      this.cancelPolling();
  }

  setSnapshotTimer = () => {
      this.snapshotTimer = setTimeout(() => {
        this.setState({snapshotTimestamp: 0});
        this.snapshotTimer = null;
      }, 2500);
  }

  takeSnapshot = () => {
    if(!this.state.validLogin) {
      return;
    }
    if (this.snapshotTimer) {
      console.log('snapshot is already being shown. Taking a new one');
      clearTimeout(this.snapshotTimer);
      this.setState({snapshotTimestamp: 0});
    }

    doFetch('/api/vlc/is_playing', "GET")
    .then(response => {
      let timestamp = -1;

      if (response) {
        // Use a unique query parameter so that the browser takes
        // a new snapshot rather than serving up an old one
        timestamp = new Date().getTime();
      }

      this.setState({snapshotTimestamp: timestamp});
      this.setSnapshotTimer();
    })
    .catch(error => {
      this.setState({snapshotTimestamp: -1});
      this.setSnapshotTimer();
    });
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

  recordPressed = () => {
    if(!this.state.validLogin) {
      return;
    }
    doFetch('/api/vlc/keypress/record', 'POST')
    .then(response => {
      this.setState(prev => ({ recording: !prev.recording}))
    })
    .catch(error => {})
  }


  checkLogin = () => {
    const cookies = new Cookies();
    let token = cookies.get('token');
    let decode = jwt.decode(token);
    if(token) {
      // @ts-ignore  (ignore Visual Studio warnings on the next line)
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
      console.warn("Unable to obtain presets");
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
      console.debug("Polling for preset");
      doFetch('/api/current_preset', 'GET')
      .then(response => {
        console.debug("Current preset: " + response.current_preset);
        this.setState({currentPreset: response.current_preset});
      })
      .catch(error => {
        console.error("Cancelling polling. Error polling for current position " + error);
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
    let updateMenu;
    let homeMenu;
    let aboutMenu;
    let manageAccount;

    if(this.state.currentView==='home') {
      const buttons = this.state.presets.map(e => {
        let cls="presetImgs";
        if (e.num === this.state.currentPreset) {
          if(this.state.pending) {
            cls+=" pending";
          } else {
            cls+= " selectedImg";
          }
          if(!this.state.validLogin) {
            cls+= " viewOnly";
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
      let img;
      if (this.state.snapshotTimestamp > 0) {
        img = (<img alt='snapshot' src={"/api/vlc/snapshot?t=" + this.state.snapshotTimestamp}/>);
      } else if (this.state.snapshotTimestamp < 0) {
        img = (<img alt='snapshot' src={process.env.PUBLIC_URL + 'images/not_playing.png'} />);
      }

      let recordClass = 'outer';
      if(!this.state.validLogin) {
        recordClass += ' inactive';
      }
      let recordingBtn;
      if (this.state.recording) {
        recordingBtn = (
          <FiberManualRecord className='inner recording' onClick={() => this.recordPressed()} />
        );
      }

      let camera = undefined;
      if (this.state.validLogin) {
        camera = (
          <React.Fragment>
            <PhotoCamera className='camera' onClick={() => this.takeSnapshot()} />
            {img}
          </React.Fragment>
        );
      }

      homeMenu = (
        <React.Fragment>
          <div className='presetContainer'>
            {buttons}
          </div>
          <div className="snapshot">
            <div className="record">
              <FiberManualRecord className={recordClass} onClick={() => this.recordPressed()}/>
              {recordingBtn}
            </div>
            {camera}
          </div>
        </React.Fragment>
      );
    }
    else if(this.state.currentView==="about") {
      aboutMenu = (
      <div className='presetContainer'>
        <div className={aboutMenu}>Copyright Gary Smith and Holly Donis 2018</div>
      </div>);
    }
    else if(this.state.currentView==='login') {
      credentialsMenu = (<Login onSuccess={this.onSuccess}/>);
    }
    else if(this.state.currentView==="settings") {
      // TODO: This looks problematic. It may possibly trigger multiple timers
      settingsMenu = (<Settings onComplete={this.initialLoadPresets}/>); //only admin
    }
    else if(this.state.currentView==='update') {
      updateMenu = (<UpdatePreset onComplete={this.initialLoadPresets}/>);  //only admin
    }
    else if(this.state.currentView==='manageAccount') {
      manageAccount = (<ManageAccount admin={this.state.admin} username={this.state.username}
                       onComplete={() => this.setState({currentView: 'home'})}/>);
    }

    let upperRight;
    if(this.state.validLogin) {
      if(this.state.currentView==='home') {
        const welcomeMessage = "Hello, " + this.state.display_name;
        upperRight = <div className="usermenu" onClick={this.iconClicked}>{welcomeMessage}</div>;
      } else {
        upperRight = (
          <div className="usermenu">
              <Home className='home' onClick={() => this.sideButtonClicked("home")} />
          </div>
        );
      }
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
            <div className={adminOptions} onClick={()=> this.sideButtonClicked("update")}>Update Presets</div>
            <div className={loginView} onClick={()=> this.sideButtonClicked("login")}>Login</div>

            <div className={userOptions} onClick={()=> this.sideButtonClicked("manageAccount")}>Manage Users</div>
            <div className="options" onClick={()=> this.sideButtonClicked("about")}>About</div>
            <div className={userOptions} onClick={()=> this.logoutClicked()}>Logout</div>

          </div>
          <span className="hamburger" onClick={(e) => this.openNav()}>&#9776;</span>
          <div className="title">PTZ Camera Control</div>
          {upperRight}
        </div>
        <div className="middleView">
          {homeMenu}
          {aboutMenu}
          {credentialsMenu}
          {settingsMenu}
          {updateMenu}
          {manageAccount}
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
