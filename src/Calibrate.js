import React, { Component } from 'react';

class Calibrate extends Component {
  constructor(props) {
    super(props);
    this.state= {
      presets: [],
      message: '',
      numPresets: 10,
      disableButton: true,
    };
  }
  componentDidMount = () => {
    if(this.props.admin) {
     this.setState({disableButton: false});
    }
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
  updateSlider(evt) {
    const val = evt.target.value;
    this.setState({numPresets: val});
    console.log('changed val:' + val);
  }

   render() {
    return (
      <div>
        <div className="header">Calibrate</div>
        <center>
        <div className="slidecontainer">
          <input type="range" min="1" max="255" value={this.state.numPresets} className="slider" onChange={this.updateSlider.bind(this)}></input>
        </div>
        <p>Max number of presets: {this.state.numPresets}</p>
        <div><button onClick={()=>this.calibrate()} disabled={this.state.disableButton}>submit</button></div>
        {this.state.message}
        </center>
      </div>
    );
   }
}


export default Calibrate;
