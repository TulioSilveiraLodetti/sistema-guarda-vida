import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './components/Home';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Publico from './components/Publico';
import DashboardAdm from './components/DashboardAdm';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import FallbackRoute from './components/FallbackRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <GuestRoute>
              <Home />
            </GuestRoute>
          }
        />
        <Route
          path="/home"
          element={
            <GuestRoute>
              <Home />
            </GuestRoute>
          }
        />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/publico"
          element={
            <GuestRoute>
              <Publico />
            </GuestRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute operatorOnly>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboardAdmin"
          element={
            <ProtectedRoute adminOnly>
              <DashboardAdm />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<FallbackRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
