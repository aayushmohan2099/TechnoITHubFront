import React from "react";
import { Outlet } from "react-router-dom";

import Header from "../../components/common/layout/Header";
import Sidebar from "../../components/common/layout/Sidebar";
import Footer from "../../components/common/layout/Footer";

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <Header />

      {/* Main Section */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar role="admin" />

        {/* Page Content */}
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AdminLayout;
