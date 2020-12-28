import React, { Component } from "react";

import { Demo } from '../'

import screen from '../../assets/screen.png'; // with import

class Landing extends Component {
    render() {
        return (
          <div className="landing">
                <div className="left-section">
                    <h1>Try a demo</h1>
                    <h3>See how <b>Velas Account</b> works and helps you improve the safety of your customers with a seamless experience</h3>
                    <Demo/>
                </div>

                <div className="right-section">
                    <img alt="pc" src={screen} />
                </div>
          </div>
        )
    }

}

export default Landing