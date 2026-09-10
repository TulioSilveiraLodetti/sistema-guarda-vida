import React from "react";
import { Navigate } from "react-router-dom";
import { getToken, getRole, getDashboardPath } from "../services/auth";

const FallbackRoute = () => {
  const token = getToken();

  if (token) {
    return <Navigate to={getDashboardPath(getRole())} replace />;
  }

  return <Navigate to="/" replace />;
};

export default FallbackRoute;
