import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import AppBackground from "./pages/AppBackground";

import AdminLayout from "./pages/layouts/AdminLayout";
import AdminDashboard from "./pages/Admin/Dashboard";
import AddEmployee from "./pages/Admin/AddEmployee";
import Employees from "./pages/Admin/Employees";

function App() {
  return (
    <AppBackground>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          {/* /admin */}
          <Route
            index
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          {/* Dashboard */}
          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />

          {/* Add Employee */}
          <Route
            path="employees"
            element={<AddEmployee />}
          />

          {/* See Employees */}
          <Route
            path="employees/list"
            element={<Employees />}
          />
        </Route>

        {/* UNKNOWN ROUTE */}
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