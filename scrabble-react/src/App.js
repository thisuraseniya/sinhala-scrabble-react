import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Landing from "./Components/Landing";
import LocalBoard from "./Components/Local/LocalBoard";
import OnlineGame from "./Components/Online/OnlineGame";
import AdminDashboard from "./Components/AdminDashboard";

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route
            exact
            path="/local"
            component={LocalBoard}
            protection="public"
          />
          <Route
            exact
            path="/multiplayer"
            component={OnlineGame}
            protection="public"
          />
          <Route
            exact
            path="/admin"
            component={AdminDashboard}
            protection="public"
          />
          <Route exact path="/" component={Landing} protection="public" />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
