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

  render() {
    let menuclass="sidenav";
    if(this.state.expanded) {
      menuclass+=" expanded";
    }
    let viewclass = ''
    if(this.state.view=="login") {
      viewclass+=' login'
    }
    const buttons = this.state.presets.map(e => (
      <div key={e.num}>
        {e.num}
        <img src={process.env.PUBLIC_URL + e.image_url}/>
      </div>
    ));

    return (
      <div>
        <div>
          <div key="sideId" className={menuclass}>
            <a href="javascript:void(0)" className="closebtn" onClick={() => this.closeNav()}> &times;</a>
            <a href="#" onClick={()=> this.sideButtonClicked('login')}>Login</a>
            <a href="#" onClick={()=> this.sideButtonClicked('address')}>Address</a>
            <a href="#" onClick={()=> this.sideButtonClicked('calibrate')}>Calibrate</a>
            <a href="#" onClick={()=> this.sideButtonClicked('update')}>Update/Upload Image</a>
            <a href="#" onClick={()=> this.sideButtonClicked('home')}>Home</a>
          </div>
          <span onClick={(e) => this.openNav(e)}>&#9776; menu</span>
        </div>
        <div className="title">PTZ Camera App</div>
        <div className="header">
          {this.state.view}
        </div>
        <div></div>
        <div className="content">
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
  }
}

export default App;
