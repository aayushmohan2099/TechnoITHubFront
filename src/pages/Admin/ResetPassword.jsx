import React, { useEffect, useState } from "react";

import {
    getAllEmployees,
    resetEmployeePassword,
} from "../../api/employeeApi";

const ResetPassword = () => {
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [resetting, setResetting] = useState(false);

    const [selectedEmployee, setSelectedEmployee] = useState("");

    const [search, setSearch] = useState("");

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [resetResult, setResetResult] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // --------------------------------------------------
    // Fetch Employees
    // --------------------------------------------------
    const fetchEmployees = async (searchValue = "") => {
        try {
            setLoadingEmployees(true);
            setErrorMessage("");

            const data = await getAllEmployees({
                page: 1,
                search: searchValue.trim(),
            });

            console.log(
                "Employees Response:",
                data
            );

            if (Array.isArray(data)) {
                setEmployees(data);
            } else if (
                Array.isArray(data?.results)
            ) {
                setEmployees(data.results);
            } else if (
                Array.isArray(data?.data)
            ) {
                setEmployees(data.data);
            } else {
                setEmployees([]);
            }
        } catch (error) {
            console.error(
                "Error fetching employees:",
                error
            );

            setErrorMessage(
                error?.response?.data?.detail ||
                "Failed to load employees."
            );

            setEmployees([]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    // --------------------------------------------------
    // Initial Load
    // --------------------------------------------------
    useEffect(() => {
        fetchEmployees();
    }, []);

    // --------------------------------------------------
    // Search Employees from Backend
    // --------------------------------------------------
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchEmployees(search);
        }, 400);

        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    // --------------------------------------------------
    // Handle Search Change
    // --------------------------------------------------
    const handleSearchChange = (e) => {
        const value = e.target.value;

        setSearch(value);

        // Clear previous selection
        setSelectedEmployee("");

        setSuccessMessage("");
        setErrorMessage("");
    };

    // --------------------------------------------------
    // Clear Search
    // --------------------------------------------------
    const handleClearSearch = () => {
        setSearch("");
        setSelectedEmployee("");
        setSuccessMessage("");
        setErrorMessage("");
    };

    // --------------------------------------------------
    // Reset Password
    // --------------------------------------------------
    const handleResetPassword = async () => {
        if (!selectedEmployee) {
            setErrorMessage(
                "Please select an employee."
            );

            return;
        }

        try {
            setResetting(true);
            setErrorMessage("");
            setSuccessMessage("");

            const response =
                await resetEmployeePassword(
                    selectedEmployee
                );

            console.log(
                "Reset Password Response:",
                response
            );

            setResetResult(response);

            setShowModal(true);

            setSuccessMessage(
                "Password reset successfully."
            );
        } catch (error) {
            console.error(
                "Reset password error:",
                error
            );

            const backendError =
                error?.response?.data;

            if (
                typeof backendError ===
                "string"
            ) {
                setErrorMessage(
                    backendError
                );
            } else if (
                backendError?.detail
            ) {
                setErrorMessage(
                    backendError.detail
                );
            } else if (backendError) {
                setErrorMessage(
                    Object.values(
                        backendError
                    )
                        .flat()
                        .join(" ")
                );
            } else {
                setErrorMessage(
                    "Failed to reset password."
                );
            }
        } finally {
            setResetting(false);
        }
    };

    // --------------------------------------------------
    // Copy Password
    // --------------------------------------------------
    const handleCopyPassword = async () => {
        if (
            !resetResult?.new_temporary_password
        ) {
            return;
        }

        try {
            await navigator.clipboard.writeText(
                resetResult.new_temporary_password
            );

            setSuccessMessage(
                "Temporary password copied."
            );
        } catch (error) {
            console.error(
                "Copy failed:",
                error
            );

            setErrorMessage(
                "Unable to copy password."
            );
        }
    };

    // --------------------------------------------------
    // Download Credentials
    // --------------------------------------------------
    const handleDownload = () => {
        if (!resetResult) {
            return;
        }

        const content = `
Employee Password Reset
=======================

Employee ID: ${resetResult.employee_id}
Temporary Password: ${resetResult.new_temporary_password}

Please ask the employee to change the temporary password after logging in.
`;

        const blob = new Blob(
            [content],
            {
                type: "text/plain",
            }
        );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `${resetResult.employee_id}-password-reset.txt`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    // --------------------------------------------------
    // Close Modal
    // --------------------------------------------------
    const closeModal = () => {
        setShowModal(false);
        setResetResult(null);
    };

    return (
        <div className="min-h-full bg-gray-50 p-6">

            {/* Header */}
            <div className="mb-6">

                <h1 className="text-2xl font-semibold text-ettm-blue">
                    Reset Employee Password
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Search for an employee and reset
                    their password.
                </p>

            </div>

            {/* Success */}
            {successMessage &&
                !showModal && (
                    <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {successMessage}
                    </div>
                )}

            {/* Error */}
            {errorMessage && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errorMessage}
                </div>
            )}

            {/* Main Card */}
            <div className="max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                <h2 className="text-lg font-semibold text-gray-800">
                    Select Employee
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Search by employee name,
                    employee ID, or designation.
                </p>

                {/* Search */}
                <div className="mt-5">

                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Search Employee
                    </label>

                    <div className="flex gap-2">

                        <input
                            type="text"
                            value={search}
                            onChange={
                                handleSearchChange
                            }
                            placeholder="Search name, Employee ID or designation..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={
                                    handleClearSearch
                                }
                                className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Clear
                            </button>
                        )}

                    </div>

                    {search && (
                        <p className="mt-2 text-xs text-gray-400">
                            Searching all employees for
                            "{search}"
                        </p>
                    )}

                </div>

                {/* Employee List */}
                <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-gray-200">

                    {loadingEmployees ? (

                        <div className="p-5 text-center text-sm text-gray-500">
                            Searching employees...
                        </div>

                    ) : employees.length >
                        0 ? (

                        employees.map(
                            (employee) => {

                                const isSelected =
                                    selectedEmployee ===
                                    employee.employee_id;

                                return (
                                    <button
                                        key={
                                            employee.id
                                        }
                                        type="button"
                                        onClick={() =>
                                            setSelectedEmployee(
                                                employee.employee_id
                                            )
                                        }
                                        className={`flex w-full items-center justify-between border-b border-gray-100 px-4 py-4 text-left transition last:border-b-0 ${isSelected
                                            ? "bg-blue-50"
                                            : "hover:bg-gray-50"
                                            }`}
                                    >

                                        <div>

                                            <p className="text-sm font-semibold text-gray-800">
                                                {
                                                    employee.name
                                                }
                                            </p>

                                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">

                                                <span>
                                                    ID:{" "}
                                                    {
                                                        employee.employee_id
                                                    }
                                                </span>

                                                <span>
                                                    {
                                                        employee.designation ||
                                                        "-"
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                        {isSelected && (
                                            <span className="text-xs font-semibold text-ettm-blue">
                                                Selected
                                            </span>
                                        )}

                                    </button>
                                );
                            }
                        )

                    ) : (

                        <div className="p-5 text-center">

                            <p className="text-sm font-medium text-gray-500">
                                No employees found.
                            </p>

                            {search && (
                                <p className="mt-1 text-xs text-gray-400">
                                    No employee matched
                                    "{search}".
                                </p>
                            )}

                        </div>

                    )}

                </div>

                {/* Selected Employee */}
                {selectedEmployee && (
                    <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">

                        <p className="text-xs font-semibold uppercase tracking-wide text-ettm-blue">
                            Selected Employee
                        </p>

                        <div className="mt-3">

                            <p className="text-sm text-gray-500">
                                Employee ID
                            </p>

                            <p className="text-base font-semibold text-gray-800">
                                {selectedEmployee}
                            </p>

                        </div>

                    </div>
                )}

                {/* Reset Button */}
                <div className="mt-6 flex justify-end">

                    <button
                        type="button"
                        onClick={
                            handleResetPassword
                        }
                        disabled={
                            !selectedEmployee ||
                            resetting
                        }
                        className="rounded-lg bg-ettm-blue px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {resetting
                            ? "Resetting..."
                            : "Reset Password"}
                    </button>

                </div>

            </div>

            {/* PASSWORD RESET MODAL */}
            {showModal &&
                resetResult && (

                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

                            {/* Modal Header */}
                            <div className="border-b border-gray-200 px-6 py-5">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <h2 className="text-lg font-semibold text-gray-800">
                                            Password Reset Successfully
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-500">
                                            Save or copy the
                                            temporary password.
                                        </p>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={
                                            closeModal
                                        }
                                        className="text-xl text-gray-400 hover:text-gray-700"
                                    >
                                        ×
                                    </button>

                                </div>

                            </div>

                            {/* Modal Body */}
                            <div className="space-y-5 px-6 py-6">

                                <div className="rounded-lg border border-green-200 bg-green-50 p-4">

                                    <p className="text-sm font-medium text-green-700">
                                        {
                                            resetResult.message
                                        }
                                    </p>

                                </div>

                                {/* Employee ID */}
                                <div>

                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Employee ID
                                    </p>

                                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">

                                        <p className="font-semibold text-gray-800">
                                            {
                                                resetResult.employee_id
                                            }
                                        </p>

                                    </div>

                                </div>

                                {/* Temporary Password */}
                                <div>

                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        New Temporary Password
                                    </p>

                                    <div className="flex items-center gap-2">

                                        <div className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3">

                                            <p className="break-all font-mono text-sm font-semibold text-gray-800">
                                                {
                                                    resetResult.new_temporary_password
                                                }
                                            </p>

                                        </div>

                                        <button
                                            type="button"
                                            onClick={
                                                handleCopyPassword
                                            }
                                            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Copy
                                        </button>

                                    </div>

                                </div>

                                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">

                                    <p className="text-xs leading-5 text-yellow-700">
                                        This temporary password
                                        should be shared securely
                                        with the employee.
                                    </p>

                                </div>

                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">

                                <button
                                    type="button"
                                    onClick={
                                        handleDownload
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Download
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        closeModal
                                    }
                                    className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
                                >
                                    Done
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </div>
    );
};

export default ResetPassword;