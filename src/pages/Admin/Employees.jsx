import React, { useEffect, useState } from "react";

import Card from "../../components/common/Card";
import Table from "../../components/common/Table";

import { getAllEmployees } from "../../api/employeeApi";

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Pagination
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);

    // Single backend search
    const [search, setSearch] = useState("");

    // --------------------------------------------------
    // Fetch Employees
    // --------------------------------------------------
    const fetchEmployees = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getAllEmployees({
                page,
                search: search.trim(),
            });

            console.log("Get All Employees Response:", response);

            // Paginated response
            if (Array.isArray(response?.results)) {
                setEmployees(response.results);

                setTotalCount(response.count || 0);
                setNextPage(response.next || null);
                setPreviousPage(response.previous || null);

                return;
            }

            // Backend response with data array
            if (Array.isArray(response?.data)) {
                setEmployees(response.data);

                setTotalCount(
                    response.count || response.data.length
                );

                setNextPage(response.next || null);
                setPreviousPage(response.previous || null);

                return;
            }

            // Normal array response
            if (Array.isArray(response)) {
                setEmployees(response);
                setTotalCount(response.length);
                setNextPage(null);
                setPreviousPage(null);

                return;
            }

            setEmployees([]);
            setTotalCount(0);
            setNextPage(null);
            setPreviousPage(null);

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

    // --------------------------------------------------
    // Fetch whenever page/search changes
    // --------------------------------------------------
    useEffect(() => {
        fetchEmployees();
    }, [page, search]);

    // --------------------------------------------------
    // Search Change
    // --------------------------------------------------
    const handleSearchChange = (e) => {
        setSearch(e.target.value);

        // Search results always start from page 1
        setPage(1);
    };

    // --------------------------------------------------
    // Clear Search
    // --------------------------------------------------
    const handleClearSearch = () => {
        setSearch("");
        setPage(1);
    };

    // --------------------------------------------------
    // Table Columns
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Pagination Information
    // --------------------------------------------------
    const pageSize = 10;

    const startEmployee =
        totalCount === 0
            ? 0
            : (page - 1) * pageSize + 1;

    const endEmployee = Math.min(
        page * pageSize,
        totalCount
    );

    const totalPages =
        Math.ceil(totalCount / pageSize) || 1;

    return (
        <div className="p-6">

            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    See Employees
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    View and search all employees
                    registered in the system.
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

            {/* Statistics */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {/* Total Employees */}
                <Card padding="medium">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Total Employees
                        </p>

                        <p className="mt-2 text-3xl font-bold text-ettm-blue">
                            {loading
                                ? "..."
                                : totalCount}
                        </p>
                    </div>
                </Card>

                {/* Showing */}
                <Card padding="medium">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Showing
                        </p>

                        <p className="mt-2 text-3xl font-bold text-green-600">
                            {loading
                                ? "..."
                                : employees.length}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                            Employees on this page
                        </p>
                    </div>
                </Card>

                {/* Current Page */}
                <Card padding="medium">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Current Page
                        </p>

                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {loading
                                ? "..."
                                : `${page} / ${totalPages}`}
                        </p>
                    </div>
                </Card>

            </div>

            {/* Search */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                <div className="mb-4 flex items-center justify-between">

                    <div>
                        <h2 className="text-base font-semibold text-gray-800">
                            Search Employees
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                            Search by employee name,
                            employee ID, or designation.
                        </p>
                    </div>

                    {search && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            className="text-sm font-medium text-ettm-blue hover:underline"
                        >
                            Clear Search
                        </button>
                    )}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Search
                    </label>

                    <input
                        type="text"
                        value={search}
                        onChange={handleSearchChange}
                        placeholder="Search name, employee ID or designation..."
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
                    />
                </div>

                {search && (
                    <p className="mt-2 text-xs text-gray-400">
                        Searching for: "{search}"
                    </p>
                )}
            </div>

            {/* Employee Table */}
            <Card
                title="Employee List"
                subtitle={
                    totalCount > 0
                        ? `Showing ${startEmployee}-${endEmployee} of ${totalCount} employees`
                        : "No employees found."
                }
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
                    <>
                        <Table
                            columns={columns}
                            data={employees}
                            keyField="id"
                            emptyMessage={
                                search
                                    ? `No employees found for "${search}".`
                                    : "No employees found."
                            }
                        />

                        {/* Pagination */}
                        {totalCount > 0 && (
                            <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                                <div>
                                    <p className="text-sm text-gray-500">
                                        Showing{" "}
                                        <span className="font-medium text-gray-700">
                                            {startEmployee}
                                        </span>
                                        {" - "}
                                        <span className="font-medium text-gray-700">
                                            {endEmployee}
                                        </span>
                                        {" of "}
                                        <span className="font-medium text-gray-700">
                                            {totalCount}
                                        </span>
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Page {page} of {totalPages}
                                    </p>
                                </div>

                                <div className="flex gap-2">

                                    {/* Previous */}
                                    <button
                                        type="button"
                                        disabled={
                                            !previousPage ||
                                            loading ||
                                            page <= 1
                                        }
                                        onClick={() =>
                                            setPage((current) =>
                                                Math.max(
                                                    1,
                                                    current - 1
                                                )
                                            )
                                        }
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>

                                    {/* Current Page */}
                                    <div className="flex min-w-10 items-center justify-center rounded-lg bg-ettm-blue px-4 py-2 text-sm font-semibold text-white">
                                        {page}
                                    </div>

                                    {/* Next */}
                                    <button
                                        type="button"
                                        disabled={
                                            !nextPage ||
                                            loading ||
                                            page >= totalPages
                                        }
                                        onClick={() =>
                                            setPage(
                                                (current) =>
                                                    current + 1
                                            )
                                        }
                                        className="rounded-lg bg-ettm-blue px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>

                                </div>
                            </div>
                        )}
                    </>
                )}

            </Card>
        </div>
    );
};

export default Employees;