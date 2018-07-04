import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state={
      expanded: false,
      presets : [],
      view: '',
      imgSelected: null,
      numSelected: 0,
      contentDiv: "content",
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
    if(e.target.className=="presetImgs selectedImg") {
      e.target.className= "presetImgs";
      this.setState({imgSelected: null});
    }
    else {
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
      <div key={e.num} className='presetBoxes' onClick={this.presetClicked}>
        {e.num}
        <img src={process.env.PUBLIC_URL + e.image_url} className="presetImgs"/>
      </div>
    ));

    return (
      <div>
        <div>
          <div key="sideId" className={menuclass}>
            <a href="javascript:void(0)" className="closebtn" onClick={() => this.closeNav()}> &times;</a>
            <a href="#" onClick={()=> this.sideButtonClicked('Login')}>Login</a>
            <a href="#" onClick={()=> this.sideButtonClicked('IP address')}>Address</a>
            <a href="#" onClick={()=> this.sideButtonClicked('Calibrate')}>Calibrate</a>
            <a href="#" onClick={()=> this.sideButtonClicked('Update/Upload Image')}>Update/Upload Image</a>
            <a href="#" onClick={()=> this.sideButtonClicked('Home')}>Home</a>
          </div>
          <span onClick={(e) => this.openNav(e)}>&#9776; menu</span>
        </div>
        <div className="title">PTZ Camera App</div>
        <div className="header">
          {this.state.view}
        </div>
        <div className="login">
            Username: <input type= "text" key="username"/>
            Password: <input type= "text" key="password"/>
            <button key="submit">submit</button>
        </div>
        <div className={this.state.contentDiv}>
          {buttons}
        </div>
      </div>
    );
  }
  closeNav() {
    this.setState({expanded: false});
  }
  openNav() {
    this.setState({expanded: true});
  }
  sideButtonClicked(str) {
    this.closeNav();
    this.setState({view: str});
    if(str!= '' && str != 'Home') {
      this.setState({contentDiv: "content hidden"});
    }
    else {
      this.setState({contentDiv: "content"});
    }
  }
}

export default App;
