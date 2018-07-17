import React, { Component } from 'react';

class Update extends Component {
  constructor(props) {
    super(props);
    this.state = {
      disableButton: true,
    };
  }
  componentDidMount = () => {
    if(this.props.admin) {
      this.setState({disableButton: false});
    }
  }
  render() {
   return (
      <div>
        <div className ="header">Update/Upload Image</div>
        <div className ="view">
          <div className ="imgRow viewDiv">Pick the image number to upload or update: <input type = "text"/></div>
          <div className ="imgRow viewDiv">
            Image: <input type = "text" key ="imgName"/>
            <button disabled = {this.state.disableButton}>submit</button>
           </div>
        </div>
      </div>
    );
   }
}

export default Update;
