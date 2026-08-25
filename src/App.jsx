import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import AppBackground from "./pages/AppBackground";

// ===============================
// ADMIN
// ===============================
import AdminLayout from "./pages/layouts/AdminLayout";
import AdminDashboard from "./pages/Admin/Dashboard";
import AddEmployee from "./pages/Admin/AddEmployee";
import Employees from "./pages/Admin/Employees";
import Tasks from "./pages/Admin/Tasks";
import ResetPassword from "./pages/Admin/ResetPassword";
import TaskList from "./pages/Admin/TaskList";
import Attendance from "./pages/Admin/Attendance";


// ===============================
// EMPLOYEE
// ===============================
import EmployeeLayout from "./pages/layouts/EmployeeLayout";
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";
import EmployeeAttendance from "./pages/Employee/Attendance";

function App() {
  return (
    <AppBackground>
      <Routes>

        {/* =========================
                    LOGIN
                ========================= */}
        <Route
          path="/login"
          element={<Login />}
        />


        {/* =========================
                    ADMIN
                ========================= */}
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

          {/* Assign Task */}
          <Route
            path="tasks"
            element={<Tasks />}
          />

          {/* See Tasks */}
          <Route
            path="tasklist"
            element={<TaskList />}
          />

          {/* Attendance */}
          <Route
            path="attendance"
            element={<Attendance />}
          />

          {/* Reset Password */}
          <Route
            path="reset-password"
            element={<ResetPassword />}
          />

        </Route>


        {/* =========================
                    EMPLOYEE
                ========================= */}
        <Route
          path="/employee"
          element={<EmployeeLayout />}
        >

          {/* /employee → /employee/dashboard */}
          <Route
            index
            element={
              <Navigate
                to="/employee/dashboard"
                replace
              />
            }
          />

          {/* Employee Dashboard */}
          <Route
            path="dashboard"
            element={<EmployeeDashboard />}
          />

          {/* Employee Attendance - add later */}

          <Route
            path="attendance"
            element={<EmployeeAttendance />}
          />


          {/* My Tasks - add later */}
          {/* 
                    <Route
                        path="tasks"
                        element={<MyTasks />}
                    />
                    */}

          {/* Daily Progress - add later */}
          {/* 
                    <Route
                        path="progress"
                        element={<DailyProgress />}
                    />
                    */}

        </Route>


        {/* =========================
                    UNKNOWN ROUTE
                ========================= */}
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