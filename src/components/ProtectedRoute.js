import React from "react";
import { Navigate } from "react-router-dom";
import { getToken, getRole } from "../services/auth";

const ProtectedRoute = ({ children, adminOnly = false, operatorOnly = false }) => {
  const token = getToken();
  const role = getRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  if (operatorOnly && role === "ADMIN") {
    return <Navigate to="/dashboardAdmin" replace />;
  }

  return children;
};

export default ProtectedRoute;
