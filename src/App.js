import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

  class Login extends Component {
    constructor(props) {
      super(props);
      this.state = {
        username: 'church',
        password: '0000',
        triedUser: '',
        triedPass: '',
        message: '',
        sucess: false,
      };
    }
    submitClicked() {
      if((this.state.triedPass===this.state.password) && (this.state.triedUser===this.state.username)) {
        this.setState({message: 'Welcome user!'});
        this.setState({sucess: true});
      }
      else {
        this.setState({message: 'Login failed.'});
      }
    }
    updateUser(evt) {
      this.setState({triedUser: evt.target.value});
    }
    updatePass(evt) {
      this.setState({triedPass: evt.target.value});
    }
    render() {

    //fix coloring!!!!
     let messageClass='imgRow viewDiv';
     if(this.state.message==='Welcome user!') {
        messageClass='imgRow viewDiv green';
     }
     else if(this.state.message==='Login failed.') {
        messageClass+='imgRow viewDiv red';
     }
     return (
       <div>
          <div className="header">Login</div>
          <div className="view">
             <div className="imgRow viewDiv">Username: <input type= "text" key="username" value={this.state.triedUser} onChange={this.updateUser.bind(this)}/></div>
             <div className="imgRow viewDiv">Password: <input type= "password" value={this.state.triedPass} onChange={this.updatePass.bind(this)}/></div>
             <div className="imgRow viewDiv"><button key="submit" onClick={() => this.submitClicked()}>submit</button></div>
             <div className={messageClass}>{this.state.message}</div>
          </div>
        </div>
      );
     }
  }

  class Address extends Component {
    constructor(props) {
      super(props);
        this.state= {
          inputValue: '',
          currentAddress: '128.0.0.0',
        };
    }
    enterClicked() {
      if(this.state.inputValue!='') {
        let tempAdd= this.state.inputValue;
        this.setState({currentAddress: tempAdd});
      }
    }
    updateInputValue(evt) {
       this.setState({inputValue: evt.target.value});
    }
    render() {
      return (
      <div>
        <div className="header">IP Address</div>
        <div className="view">
          <div className="imgRow viewDiv">Current IP Address: {this.state.currentAddress}</div>
          <div className="imgRow viewDiv">Change IP Address:<input type= "text" key="newAddress" value={this.state.inputValue} onChange={this.updateInputValue.bind(this)}></input></div>
          <div className="imgRow viewDiv"><button key="addressButton" onClick={() => this.enterClicked()}>Enter</button></div>
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
      imgSelected: null,
      header: "",
      showCredentials: false,
      showAddress: false,
      showCalibrate: false,
      showUpdate: false,
      showHome: false,

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
      });
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

  presetClicked = (e) => {
    let src = e.target.src;
    if(e.target.className=="presetImgs") {
      let oldPic = this.state.imgSelected;
      e.target.className+= " selectedImg";
      if(oldPic) {
        oldPic.className="presetImgs";
      }
      this.setState({imgSelected: e.target});
    }
  }


  render() {
    let menuclass="sidenav";
    if(this.state.expanded) {
      menuclass+=" expanded";
    }

    const buttons = this.state.presets.map(e => (
      <div key={e.num} className='imgRow'>
        <div className="imgCol">
          <div className="imgNumbers">{e.num}</div>
          <img src={process.env.PUBLIC_URL + e.image_url} className="presetImgs" onClick={this.presetClicked}/>
        </div>
      </div>
    ));

    let credentialsMenu;
    let addressMenu;
    let calibrateMenu;
    let updateMenu;
    let homeMenu;

    if(this.state.showCredentials) {
      credentialsMenu = (<Login />);
      homeMenu = "home hidden";
    }
    else if(this.state.showAddress) {
      addressMenu = (<Address />);
      homeMenu = "home hidden";
    }
    else if(this.state.showCalibrate) {
      calibrateMenu = (<Calibrate />);
      homeMenu = "home hidden";
    }
    else if(this.state.showUpdate) {
      updateMenu = (<Update />);
      homeMenu = "home hidden";
    }
    else if(this.state.showHome) {
      homeMenu = "home";
    }

    return (
      <div>
        <div>
          <div key="sideId" className={menuclass}>
            <a href="javascript:void(0)" className="closebtn" onClick={() => this.closeNav()}> &times;</a>
            <a href="#" onClick={()=> this.sideButtonClicked("login")}>Login</a>
            <a href="#" onClick={()=> this.sideButtonClicked("address")}>Address</a>
            <a href="#" onClick={()=> this.sideButtonClicked("calibrate")}>Calibrate</a>
            <a href="#" onClick={()=> this.sideButtonClicked("update")}>Update/Upload Image</a>
            <a href="#" onClick={()=> this.sideButtonClicked("home")}>Home</a>
          </div>
          <span onClick={(e) => this.openNav(e)}>&#9776; menu</span>
        </div>
        <div className="title">PTZ Camera App &#9925;</div>
        <center>
          <div className={homeMenu}>
            {buttons}
          </div>
        </center>
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
    else if(str=="home") {
      this.setState({showHome: true});
      this.setState({showCredentials: false});
      this.setState({showAddress: false});
      this.setState({showCalibrate: false});
      this.setState({showUpdate: false});
    }
  }
}

export default App;
