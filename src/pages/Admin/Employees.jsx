import React, { useEffect, useState } from "react";

import Card from "../../components/common/Card";
import Table from "../../components/common/Table";

import { getAllEmployees } from "../../api/employeeApi";

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getAllEmployees();

            console.log("Get All Employees Response:", response);

            // Handle different possible backend response formats
            if (Array.isArray(response)) {
                setEmployees(response);
            } else if (Array.isArray(response?.data)) {
                setEmployees(response.data);
            } else if (Array.isArray(response?.results)) {
                setEmployees(response.results);
            } else {
                setEmployees([]);
            }

        } catch (error) {
            console.error("Get Employees Failed:", error);

            console.error(
                "Status:",
                error.response?.status
            );

            console.error(
                "Response:",
                error.response?.data
            );

            if (error.response?.status === 401) {
                setError(
                    "Your session has expired or the access token is invalid."
                );
            } else {
                setError(
                    error.response?.data?.message ||
                    error.response?.data?.detail ||
                    error.response?.data?.error ||
                    "Unable to load employees."
                );
            }

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const columns = [
        {
            key: "employee_id",
            label: "Employee ID",
        },
        {
            key: "name",
            label: "Name",
        },
        {
            key: "email",
            label: "Email",
        },
        {
            key: "phone_number",
            label: "Phone Number",
            render: (row) => row.phone_number || "-",
        },
        {
            key: "designation",
            label: "Designation",
            render: (row) => row.designation || "-",
        },
        {
            key: "created_at",
            label: "Created At",
            render: (row) => {
                if (!row.created_at) {
                    return "-";
                }

                return new Date(
                    row.created_at
                ).toLocaleDateString("en-IN");
            },
        },
    ];

    return (
        <div className="p-6">

            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    See Employees
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    View all employees registered in the system.
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-600">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={fetchEmployees}
                        className="mt-2 text-sm font-medium text-red-700 underline"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Employee Statistics */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {/* Total Employees */}
                <Card padding="medium">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Total Employees
                        </p>

                        <p className="mt-2 text-3xl font-bold text-ettm-blue">
                            {loading ? "..." : employees.length}
                        </p>
                    </div>
                </Card>

                {/* Active Employees */}
                <Card padding="medium">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Active Employees
                        </p>

                        <p className="mt-2 text-3xl font-bold text-green-600">
                            {loading ? "..." : employees.length}
                        </p>
                    </div>
                </Card>

                {/* Latest Employee */}
                <Card padding="medium">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Latest Employee
                        </p>

                        <p className="mt-2 text-lg font-bold text-gray-900">
                            {loading
                                ? "..."
                                : employees.length > 0
                                    ? employees[employees.length - 1].employee_id
                                    : "-"}
                        </p>
                    </div>
                </Card>

            </div>

            {/* Employee Table */}
            <Card
                title="Employee List"
                subtitle="All employees registered in the system."
                padding="none"
            >
                {loading ? (
                    <div className="px-5 py-10 text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-ettm-blue" />

                        <p className="mt-3 text-sm text-gray-500">
                            Loading employees...
                        </p>
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        data={employees}
                        keyField="id"
                        emptyMessage="No employees found."
                    />
                )}
            </Card>

        </div>
    );
};

export default Employees;