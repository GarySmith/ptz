import React, { Component } from 'react';

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


export default Calibrate;
