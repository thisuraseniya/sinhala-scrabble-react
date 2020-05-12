import React, { useState } from "react";

export default function NavBar(props) {
  const signout = () => {
    props.signOut();
  };

  const [expanded, setExpanded] = useState(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <a className="navbar-brand" href="./">
        Sinhala Scrabble
      </a>
      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarTogglerDemo02"
        aria-controls="navbarTogglerDemo02"
        aria-expanded={expanded}
        aria-label="Toggle navigation"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div
        className={"collapse navbar-collapse " + (expanded ? "show" : "")}
        id="navbarTogglerDemo02"
      >
        <ul className="navbar-nav ml-auto mt-2 mt-lg-0">
          {props.code && props.type === "host" && (
            <li className="nav-item">
              <div className="pull-right navbar-img">Code : {props.code}</div>
            </li>
          )}
          <li className="nav-item">
            <div className="pull-right navbar-img">
              <img
                src={props.user.photoURL}
                className="avatar-img"
                alt="user"
              />
              {props.user.displayName}
              <button
                className="btn btn-outline-primary ml-3"
                onClick={signout}
              >
                Sign out
              </button>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
}
