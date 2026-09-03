import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaCheckSquare,
  FaListAlt,
  FaClipboardList,
  FaKey,
  FaUserShield,
} from "react-icons/fa";

const Sidebar = ({ role = "admin" }) => {
  const adminMenuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: <FaHome />,
    },
    {
      name: "Add Employees",
      path: "/admin/employees",
      icon: <FaUsers />,
    },
    {
      name: "Assign Task",
      path: "/admin/tasks",
      icon: <FaCheckSquare />,
    },
    {
      name: "See Tasks",
      path: "/admin/tasklist",
      icon: <FaListAlt />,
    },
    {
      name: "Attendance",
      path: "/admin/attendance",
      icon: <FaClipboardList />,
    },
    {
      name: "Reset Password",
      path: "/admin/reset-password",
      icon: <FaKey />,
    },
    {
      name: "See Employees",
      path: "/admin/employeess/list",
      icon: <FaUserShield />,
    },
  ];

  const employeeMenuItems = [
    {
      name: "Dashboard",
      path: "/employee/dashboard",
      icon: <FaHome />,
    },
    {
      name: "Attendance",
      path: "/employee/attendance",
      icon: <FaClipboardList />,
    },
    {
      name: "My Tasks",
      path: "/employee/tasks",
      icon: <FaCheckSquare />,
    },
  ];

  const menuItems = role === "admin" ? adminMenuItems : employeeMenuItems;

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white">
      {/* Sidebar Header */}
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-ettm-blue">
          {role === "admin" ? "Admin Portal" : "Employee Portal"}
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          {role === "admin" ? "Administration" : "Employee Dashboard"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="p-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-ettm-blue text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-ettm-blue"
              }`
            }
          >
            <span className="flex w-5 justify-center text-base">
              {item.icon}
            </span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
