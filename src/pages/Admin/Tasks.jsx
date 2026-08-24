import React, { useEffect, useRef, useState } from "react";
import { getAllEmployees, createTask } from "../../api/employeeApi";

const Tasks = () => {
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        assigned_to: "",
        start_date: "",
        deadline: "",
        priority: "",
    });

    const [errors, setErrors] = useState({});

    // Search filters
    const [searchName, setSearchName] = useState("");
    const [searchId, setSearchId] = useState("");
    const [searchDesignation, setSearchDesignation] = useState("");

    // Employee search dropdown
    const [showEmployeeResults, setShowEmployeeResults] = useState(false);

    const employeeSearchRef = useRef(null);

    // --------------------------------------------------
    // Fetch Employees
    // --------------------------------------------------
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoadingEmployees(true);
                setErrorMessage("");

                const data = await getAllEmployees();

                console.log("Employees:", data);

                if (Array.isArray(data)) {
                    setEmployees(data);
                } else if (Array.isArray(data?.results)) {
                    setEmployees(data.results);
                } else {
                    setEmployees([]);
                }
            } catch (error) {
                console.error("Error fetching employees:", error);

                setErrorMessage(
                    error?.response?.data?.detail ||
                    "Failed to load employees. Please try again."
                );
            } finally {
                setLoadingEmployees(false);
            }
        };

        fetchEmployees();
    }, []);

    // --------------------------------------------------
    // Close employee results when clicking outside
    // --------------------------------------------------
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                employeeSearchRef.current &&
                !employeeSearchRef.current.contains(event.target)
            ) {
                setShowEmployeeResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    // --------------------------------------------------
    // Normal Form Input
    // --------------------------------------------------
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));

        setSuccessMessage("");
        setErrorMessage("");
    };

    // --------------------------------------------------
    // Employee Search
    // --------------------------------------------------
    const handleEmployeeSearch = (field, value) => {
        if (field === "name") {
            setSearchName(value);
        }

        if (field === "id") {
            setSearchId(value);
        }

        if (field === "designation") {
            setSearchDesignation(value);
        }

        // If admin starts searching again,
        // remove previous selection
        if (formData.assigned_to) {
            setFormData((prev) => ({
                ...prev,
                assigned_to: "",
            }));
        }

        setErrors((prev) => ({
            ...prev,
            assigned_to: "",
        }));

        setSuccessMessage("");
        setErrorMessage("");

        setShowEmployeeResults(true);
    };

    // --------------------------------------------------
    // Filter Employees
    // --------------------------------------------------
    const filteredEmployees = employees.filter((employee) => {
        const name = (employee.name || "").toLowerCase();
        const employeeId = (
            employee.employee_id || ""
        ).toLowerCase();
        const designation = (
            employee.designation || ""
        ).toLowerCase();

        const nameSearch = searchName
            .trim()
            .toLowerCase();

        const idSearch = searchId
            .trim()
            .toLowerCase();

        const designationSearch = searchDesignation
            .trim()
            .toLowerCase();

        const matchesName =
            !nameSearch || name.includes(nameSearch);

        const matchesId =
            !idSearch || employeeId.includes(idSearch);

        const matchesDesignation =
            !designationSearch ||
            designation.includes(designationSearch);

        return (
            matchesName &&
            matchesId &&
            matchesDesignation
        );
    });

    // --------------------------------------------------
    // Select Employee
    // --------------------------------------------------
    const handleEmployeeSelect = (employee) => {
        setFormData((prev) => ({
            ...prev,
            assigned_to: employee.id,
        }));

        setSearchName(employee.name || "");
        setSearchId(employee.employee_id || "");
        setSearchDesignation(employee.designation || "");

        setErrors((prev) => ({
            ...prev,
            assigned_to: "",
        }));

        setShowEmployeeResults(false);

        setSuccessMessage("");
        setErrorMessage("");
    };

    // --------------------------------------------------
    // Clear Employee Selection
    // --------------------------------------------------
    const clearEmployeeSelection = () => {
        setFormData((prev) => ({
            ...prev,
            assigned_to: "",
        }));

        setSearchName("");
        setSearchId("");
        setSearchDesignation("");

        setErrors((prev) => ({
            ...prev,
            assigned_to: "",
        }));
    };

    // --------------------------------------------------
    // Selected Employee
    // --------------------------------------------------
    const selectedEmployee = employees.find(
        (employee) =>
            Number(employee.id) ===
            Number(formData.assigned_to)
    );

    // --------------------------------------------------
    // Validation
    // --------------------------------------------------
    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title =
                "Task title is required.";
        }

        if (!formData.description.trim()) {
            newErrors.description =
                "Description is required.";
        }

        if (!formData.assigned_to) {
            newErrors.assigned_to =
                "Please search and select an employee.";
        }

        if (!formData.start_date) {
            newErrors.start_date =
                "Start date is required.";
        }

        if (!formData.deadline) {
            newErrors.deadline =
                "Deadline is required.";
        }

        if (
            formData.start_date &&
            formData.deadline &&
            formData.deadline <
            formData.start_date
        ) {
            newErrors.deadline =
                "Deadline cannot be before the start date.";
        }

        if (!formData.priority) {
            newErrors.priority =
                "Please select a priority.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    // --------------------------------------------------
    // Submit Task
    // --------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        setSuccessMessage("");
        setErrorMessage("");

        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);

            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                assigned_to: Number(
                    formData.assigned_to
                ),
                start_date: formData.start_date,
                deadline: formData.deadline,
                priority: formData.priority,
            };

            console.log(
                "Task Payload:",
                payload
            );

            const response =
                await createTask(payload);

            console.log(
                "Task Created:",
                response
            );

            setSuccessMessage(
                "Task assigned successfully!"
            );

            setFormData({
                title: "",
                description: "",
                assigned_to: "",
                start_date: "",
                deadline: "",
                priority: "",
            });

            setSearchName("");
            setSearchId("");
            setSearchDesignation("");

            setErrors({});
        } catch (error) {
            console.error(
                "Error creating task:",
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
                    "Failed to assign task. Please try again."
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    // --------------------------------------------------
    // Clear Entire Form
    // --------------------------------------------------
    const handleClear = () => {
        setFormData({
            title: "",
            description: "",
            assigned_to: "",
            start_date: "",
            deadline: "",
            priority: "",
        });

        setSearchName("");
        setSearchId("");
        setSearchDesignation("");

        setErrors({});
        setSuccessMessage("");
        setErrorMessage("");

        setShowEmployeeResults(false);
    };

    return (
        <div className="min-h-full bg-gray-50 p-6">

            {/* PAGE HEADER */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-ettm-blue">
                    Assign Task
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Create a task and assign it
                    to an employee.
                </p>
            </div>

            {/* SUCCESS MESSAGE */}
            {successMessage && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {successMessage}
                </div>
            )}

            {/* ERROR MESSAGE */}
            {errorMessage && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleSubmit}>

                {/* TASK DETAILS */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Task Details
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Enter the basic information
                            for the task.
                        </p>
                    </div>

                    {/* TITLE */}
                    <div className="mb-5">
                        <label
                            htmlFor="title"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Task Title
                            <span className="text-red-500">
                                {" "}*
                            </span>
                        </label>

                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter task title"
                            className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ettm-blue/20 ${errors.title
                                ? "border-red-400"
                                : "border-gray-300"
                                }`}
                        />

                        {errors.title && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    {/* DESCRIPTION */}
                    <div>
                        <label
                            htmlFor="description"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Description
                            <span className="text-red-500">
                                {" "}*
                            </span>
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            value={
                                formData.description
                            }
                            onChange={handleChange}
                            placeholder="Describe the task..."
                            rows={5}
                            className={`w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ettm-blue/20 ${errors.description
                                ? "border-red-400"
                                : "border-gray-300"
                                }`}
                        />

                        {errors.description && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* ASSIGNMENT */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Assignment
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Search employees using
                            Name, Employee ID,
                            or Designation.
                        </p>
                    </div>

                    <div
                        ref={employeeSearchRef}
                        className="relative"
                    >

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                            {/* NAME */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Employee Name
                                </label>

                                <input
                                    type="text"
                                    value={searchName}
                                    disabled={
                                        loadingEmployees
                                    }
                                    placeholder="Search by name"
                                    onFocus={() =>
                                        setShowEmployeeResults(
                                            true
                                        )
                                    }
                                    onChange={(e) =>
                                        handleEmployeeSearch(
                                            "name",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
                                />
                            </div>

                            {/* EMPLOYEE ID */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Employee ID
                                </label>

                                <input
                                    type="text"
                                    value={searchId}
                                    disabled={
                                        loadingEmployees
                                    }
                                    placeholder="Search by employee ID"
                                    onFocus={() =>
                                        setShowEmployeeResults(
                                            true
                                        )
                                    }
                                    onChange={(e) =>
                                        handleEmployeeSearch(
                                            "id",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
                                />
                            </div>

                            {/* DESIGNATION */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Designation
                                </label>

                                <input
                                    type="text"
                                    value={
                                        searchDesignation
                                    }
                                    disabled={
                                        loadingEmployees
                                    }
                                    placeholder="Search by designation"
                                    onFocus={() =>
                                        setShowEmployeeResults(
                                            true
                                        )
                                    }
                                    onChange={(e) =>
                                        handleEmployeeSearch(
                                            "designation",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
                                />
                            </div>
                        </div>

                        {/* SEARCH RESULTS */}
                        {showEmployeeResults &&
                            !loadingEmployees && (
                                <div className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">

                                    {/* Result Count */}
                                    <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
                                        <p className="text-xs font-medium text-gray-500">
                                            {filteredEmployees.length}{" "}
                                            employee
                                            {filteredEmployees.length !==
                                                1
                                                ? "s"
                                                : ""}{" "}
                                            found
                                        </p>
                                    </div>

                                    {filteredEmployees.length >
                                        0 ? (
                                        filteredEmployees.map(
                                            (employee) => (
                                                <button
                                                    key={
                                                        employee.id
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        handleEmployeeSelect(
                                                            employee
                                                        )
                                                    }
                                                    className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-gray-50"
                                                >
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">
                                                            {
                                                                employee.name
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {
                                                                employee.employee_id
                                                            }{" "}
                                                            •{" "}
                                                            {
                                                                employee.designation
                                                            }
                                                        </p>
                                                    </div>

                                                    <span className="text-xs font-medium text-ettm-blue">
                                                        Select
                                                    </span>
                                                </button>
                                            )
                                        )
                                    ) : (
                                        <div className="px-4 py-6 text-center">
                                            <p className="text-sm font-medium text-gray-500">
                                                No employees found
                                            </p>

                                            <p className="mt-1 text-xs text-gray-400">
                                                Try changing
                                                your search
                                                filters.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                    </div>

                    {/* FILTER INFO */}
                    <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            You can use one or multiple
                            filters together.
                        </p>

                        {(searchName ||
                            searchId ||
                            searchDesignation) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchName("");
                                        setSearchId("");
                                        setSearchDesignation(
                                            ""
                                        );
                                        setShowEmployeeResults(
                                            true
                                        );

                                        if (
                                            formData.assigned_to
                                        ) {
                                            setFormData(
                                                (prev) => ({
                                                    ...prev,
                                                    assigned_to:
                                                        "",
                                                })
                                            );
                                        }
                                    }}
                                    className="text-xs font-medium text-ettm-blue hover:underline"
                                >
                                    Clear Search
                                </button>
                            )}
                    </div>

                    {errors.assigned_to && (
                        <p className="mt-2 text-xs text-red-500">
                            {errors.assigned_to}
                        </p>
                    )}

                    {/* SELECTED EMPLOYEE */}
                    {selectedEmployee && (
                        <div className="mt-5 rounded-xl border border-ettm-blue/20 bg-blue-50/50 p-5">

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-ettm-blue">
                                        Selected Employee
                                    </p>

                                    <p className="mt-1 text-sm text-gray-500">
                                        This employee will
                                        receive the task.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        clearEmployeeSelection
                                    }
                                    className="text-xs font-medium text-gray-400 hover:text-red-500"
                                >
                                    Change
                                </button>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Name
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {
                                            selectedEmployee.name
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Employee ID
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {
                                            selectedEmployee.employee_id
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Designation
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {
                                            selectedEmployee.designation
                                        }
                                    </p>
                                </div>

                            </div>
                        </div>
                    )}
                </div>

                {/* SCHEDULE & PRIORITY */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Schedule & Priority
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Set the task dates and priority.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                        {/* START DATE */}
                        <div>
                            <label
                                htmlFor="start_date"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Start Date
                                <span className="text-red-500">
                                    {" "}*
                                </span>
                            </label>

                            <input
                                id="start_date"
                                name="start_date"
                                type="date"
                                value={
                                    formData.start_date
                                }
                                onChange={handleChange}
                                className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ettm-blue/20 ${errors.start_date
                                    ? "border-red-400"
                                    : "border-gray-300"
                                    }`}
                            />

                            {errors.start_date && (
                                <p className="mt-1 text-xs text-red-500">
                                    {
                                        errors.start_date
                                    }
                                </p>
                            )}
                        </div>

                        {/* DEADLINE */}
                        <div>
                            <label
                                htmlFor="deadline"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Deadline
                                <span className="text-red-500">
                                    {" "}*
                                </span>
                            </label>

                            <input
                                id="deadline"
                                name="deadline"
                                type="date"
                                min={
                                    formData.start_date ||
                                    undefined
                                }
                                value={
                                    formData.deadline
                                }
                                onChange={handleChange}
                                className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ettm-blue/20 ${errors.deadline
                                    ? "border-red-400"
                                    : "border-gray-300"
                                    }`}
                            />

                            {errors.deadline && (
                                <p className="mt-1 text-xs text-red-500">
                                    {
                                        errors.deadline
                                    }
                                </p>
                            )}
                        </div>

                        {/* PRIORITY */}
                        <div>
                            <label
                                htmlFor="priority"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Priority
                                <span className="text-red-500">
                                    {" "}*
                                </span>
                            </label>

                            <select
                                id="priority"
                                name="priority"
                                value={
                                    formData.priority
                                }
                                onChange={handleChange}
                                className={`w-full rounded-lg border bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-ettm-blue/20 ${errors.priority
                                    ? "border-red-400"
                                    : "border-gray-300"
                                    }`}
                            >
                                <option value="">
                                    Select Priority
                                </option>

                                <option value="Low">
                                    Low
                                </option>

                                <option value="Medium">
                                    Medium
                                </option>

                                <option value="High">
                                    High
                                </option>
                            </select>

                            {errors.priority && (
                                <p className="mt-1 text-xs text-red-500">
                                    {
                                        errors.priority
                                    }
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-3">

                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={submitting}
                        className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Clear
                    </button>

                    <button
                        type="submit"
                        disabled={
                            submitting ||
                            loadingEmployees
                        }
                        className="rounded-lg bg-ettm-blue px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting
                            ? "Assigning..."
                            : "Assign Task"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Tasks;