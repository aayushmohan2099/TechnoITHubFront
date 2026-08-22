import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import AppBackground from "./pages/AppBackground";

import AdminLayout from "./pages/layouts/AdminLayout";
import AdminDashboard from "./pages/Admin/Dashboard";

function App() {
  return (
    <AppBackground>
      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Admin Layout */}
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          {/* /admin → /admin/dashboard */}
          <Route
            index
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          {/* Admin Dashboard */}
          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />
        </Route>

        {/* Any unknown URL → Login */}
        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </AppBackground>
  );
}

export default App;