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
import MyTasks from "./pages/Employee/MyTasks";
import ChangePassword from "./pages/Employee/ChangePassword";

// Head Developer Pages
import UpSdcTracking from "./pages/Employee/UpSdcTracking";
import DeploymentBotHealth from "./pages/Employee/DeploymentBotHealth";

function App() {
  return (
    <AppBackground>
      <Routes>
        {/* =========================
            LOGIN
        ========================= */}
        <Route path="/login" element={<Login />} />

        {/* =========================
            ADMIN
        ========================= */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />

          <Route path="dashboard" element={<AdminDashboard />} />

          <Route path="employees" element={<AddEmployee />} />

          <Route path="employeess/list" element={<Employees />} />

          <Route path="tasks" element={<Tasks />} />

          <Route path="tasklist" element={<TaskList />} />

          <Route path="attendance" element={<Attendance />} />

          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        {/* =========================
            EMPLOYEE
        ========================= */}
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route
            index
            element={<Navigate to="/employee/dashboard" replace />}
          />

          <Route path="dashboard" element={<EmployeeDashboard />} />

          <Route path="attendance" element={<EmployeeAttendance />} />

          <Route path="change-password" element={<ChangePassword />} />

          <Route path="tasks" element={<MyTasks />} />

          {/* =========================
              HEAD DEVELOPER
          ========================= */}

          <Route path="up-sdc-tracking" element={<UpSdcTracking />} />

          <Route
            path="deployment-bot-health"
            element={<DeploymentBotHealth />}
          />
        </Route>

        {/* =========================
            UNKNOWN ROUTE
        ========================= */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AppBackground>
  );
}

export default App;
