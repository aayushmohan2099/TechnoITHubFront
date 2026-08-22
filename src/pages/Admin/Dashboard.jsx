import React from "react";

import Card from "../../components/common/Card";

const Dashboard = () => {
    const employeeId = localStorage.getItem("employee_id");

    return (
        <div className="p-6">

            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Admin Dashboard
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Welcome to the ETTM Admin Portal
                </p>
            </div>

            {/* Welcome Card */}
            <Card
                title="Welcome"
                subtitle={`Employee ID: ${employeeId || "Admin"}`}
            >
                <p className="text-sm text-gray-600">
                    You have successfully logged in to the Admin Portal.
                </p>
            </Card>

            {/* Dashboard Cards */}
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

                <Card>
                    <p className="text-sm text-gray-500">
                        Total Employees
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-ettm-blue">
                        0
                    </h2>
                </Card>

                <Card>
                    <p className="text-sm text-gray-500">
                        Total Applications
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-ettm-blue">
                        0
                    </h2>
                </Card>

                <Card>
                    <p className="text-sm text-gray-500">
                        Pending Applications
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-ettm-red">
                        0
                    </h2>
                </Card>

                <Card>
                    <p className="text-sm text-gray-500">
                        Completed Applications
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-green-600">
                        0
                    </h2>
                </Card>

            </div>

        </div>
    );
};

export default Dashboard;