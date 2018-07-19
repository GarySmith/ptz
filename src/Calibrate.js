import React, { Component } from 'react';

class Calibrate extends Component {
  constructor(props) {  //num_presets
    super(props);
    this.state= {
      presets: [],
      message: '',
      numPresets: 10,
      disableButton: true,
      waiting: false,
    };
  }
  componentDidMount = () => {
    this.setState({numPresets: this.props.num_presets});
    if(this.props.admin) {
     this.setState({disableButton: false});
    }
  }
  calibrate() {
    this.setState({waiting: true});
    let presets = Number(this.state.numPresets);
    let fullMessage = 'Preset number changed to ' + presets;
    const init = {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      credentials: "same-origin",
      body: JSON.stringify({max_presets: presets})
    };

    fetch('/api/calibrate', init)
    .then(response => response.json())
    .then(response => {
      this.setState({presets: response, message: fullMessage, waiting: false}); //waiting: false
      this.props.onComplete();
    })
    .catch((error)=> {
      console.log("cal error");
      this.setState({message: "Calibrate request denied.", waiting: false}); //waiting: false
    });
   }
  updateDial(evt) {
    const val = evt.target.value;
    this.setState({numPresets: val});
  }
/*
 <div className="slidecontainer">
 <input type="range" min="1" max="255" value={this.state.numPresets} className="slider" onChange={this.updateSlider.bind(this)}></input></div> */

  render() {
    let loaderClass = "loader hidden";
    if(this.state.waiting) {
      loaderClass= "loader";
    }
    return (
      <div>
        <div className="header">Calibrate</div>
        <center>
        <div className="calMessage">Max number of presets: </div>
        <input type="number" min="1" max="255" value={this.state.numPresets} className="dial" onChange={this.updateDial.bind(this)}></input>
        <div><button onClick={()=>this.calibrate()} disabled={this.state.disableButton}>submit</button></div>
        <div className={loaderClass}></div>
        <div className="calMessage">{this.state.message}</div>
        </center>
      </div>
    );
   }
}


export default Calibrate;
