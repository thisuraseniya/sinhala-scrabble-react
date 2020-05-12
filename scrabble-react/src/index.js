import React from "react";
import ReactDOM from "react-dom";
import "./Styles/bootstrap.css";
import "./Styles/grid.css";
import "./Styles/index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

ReactDOM.render(<App />, document.getElementById("root"));

serviceWorker.unregister();