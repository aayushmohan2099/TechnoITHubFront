import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import Header from "../../components/common/layout/Header";
import Sidebar from "../../components/common/layout/Sidebar";
import Footer from "../../components/common/layout/Footer";

const EmployeeLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const role = localStorage.getItem("role");
        const mustChangePassword = localStorage.getItem("must_change_password") === "true";

        if (role === "employee" && mustChangePassword && location.pathname !== "/employee/change-password") {
            navigate("/employee/change-password", { replace: true });
        }
    }, [location.pathname, navigate]);

    return (
        <div className="flex min-h-screen flex-col bg-gray-50">

            {/* Header */}
            <Header />

            {/* Main Section */}
            <div className="flex flex-1">

                {/* Sidebar */}
                <Sidebar role="employee" />

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

export default EmployeeLayout;