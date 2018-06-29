import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
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
    const buttons = this.state.presets.map(e => (
      <div key={e.num}>
        {e.num}
      </div>
    ));

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        {buttons}
      </div>
    );
  }
}

export default App;
