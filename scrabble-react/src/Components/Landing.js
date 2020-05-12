import React from "react";
import { Link } from "react-router-dom";
import AdSense from "react-adsense";

export default function Landing() {
  return (
    <div className="container">
      <div className="pricing-header px-3 py-3 pt-md-5 pb-md-4 mx-auto text-center align-middle">
        <h1 className="display-4">Sinhala Scrabble</h1>
        <p className="lead">Choose how you want to play</p>
      </div>
      <div className="card-deck mb-3 text-center container">
        <div className="card mb-4 shadow-sm">
          <div className="card-header">
            <h4 className="my-0 font-weight-normal">Local Multiplayer</h4>
          </div>
          <div className="card-body">
            <p className="lead">
              Play with a friend on the same computer
              <br />
              No need to sign in
            </p>
            <Link to="/local" className="btn btn-outline-primary btn-block">
              Start Local
            </Link>
          </div>
        </div>
        <div className="card mb-4 shadow-sm">
          <div className="card-header">
            <h4 className="my-0 font-weight-normal">Online Multiplayer</h4>
          </div>
          <div className="card-body">
            <p className="lead">
              Play with a friend or a random player online.
              <br />
              Sign in required
            </p>

            <Link
              to="/multiplayer"
              className="btn btn-outline-primary btn-block"
            >
              Start Online
            </Link>
          </div>
        </div>
      </div>
      <AdSense.Google
        client="ca-pub-4030405101948136"
        slot="7806394673"
        style={{ display: "block" }}
        format="auto"
        responsive="true"
        layoutKey="-gw-1+2a-9x+5c"
      />
    </div>
  );
}
