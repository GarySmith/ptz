import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state={
      expanded: false,
      presets : []
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
    });
  }

  render() {
    let menuclass="sidenav";
    if(this.state.expanded) {
      menuclass+=" expanded";
    }
    const buttons = this.state.presets.map(e => (
      <div key={e.num}>
        {e.num}
      </div>
    ));

    return (
      <div>
        <div>
          <div key="sideId" className={menuclass}>
            <a href="javascript:void(0)" className="closebtn" onClick={() => this.closeNav()}> &times;</a>
            <a href="#">Name</a>
            <a href="#">Address</a>
            <a href="#">Calibrate</a>
            <a href="#">Update/Upload Image</a>
          </div>
          <span onClick={(e) => this.openNav(e)}>&#9776; menu</span>
        </div>
        <div className="content">
          {buttons}
        </div>
      </div>
    );
  }
  closeNav(e) {
    this.setState({expanded: false});
  }
  openNav() {
    this.setState({expanded: true});
  }
}

export default App;
