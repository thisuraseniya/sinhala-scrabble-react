import React from "react";
import { Route, Redirect } from "react-router-dom";

const RouteGuard = ({ component: Component, protection, ...rest }) => (
  <>
    <Route
      {...rest}
      render={props => {
        if (protection === "private") {
          return <Redirect to={"/signin"} />;
        } else if (protection === "public") {
          return <Component {...props} />;
        }
      }}
    />
  </>
);

export default RouteGuard;
