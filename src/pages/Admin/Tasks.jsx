import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    createTask,
    getAllEmployees,
} from "../../api/employeeApi";

const initialFormData = {
    title: "",
    description: "",
    assigned_to: "",
    start_date: "",
    deadline: "",
    priority: "",
};

const Tasks = () => {
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] =
        useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [successMessage, setSuccessMessage] =
        useState("");
    const [errorMessage, setErrorMessage] =
        useState("");

    const [formData, setFormData] =
        useState(initialFormData);

    const [errors, setErrors] = useState({});

    const [search, setSearch] = useState("");

    const [selectedEmployee, setSelectedEmployee] =
        useState(null);

    const [
        showEmployeeResults,
        setShowEmployeeResults,
    ] = useState(false);

    const employeeSearchRef = useRef(null);

    // This prevents createTask from running twice
    const submittingRef = useRef(false);

    const fetchEmployees = useCallback(
        async (searchValue = "") => {
            try {
                setLoadingEmployees(true);
                setErrorMessage("");

                const data = await getAllEmployees({
                    page: 1,
                    search: searchValue.trim(),
                });

                console.log(
                    "Employees API response:",
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

                setEmployees([]);

                setErrorMessage(
                    error?.response?.data?.detail ||
                        "Failed to load employees."
                );
            } finally {
                setLoadingEmployees(false);
            }
        },
        []
    );

    /*
     * This single effect handles both:
     * 1. Initial employee loading
     * 2. Employee searching
     *
     * Do not add another initial fetch effect.
     */
    useEffect(() => {
        // Selecting an employee changes the search input.
        // Prevent an unnecessary API call after selection.
        if (selectedEmployee) {
            return;
        }

        const timer = setTimeout(() => {
            fetchEmployees(search);
        }, 300);

        return () => {
            clearTimeout(timer);
        };
    }, [
        search,
        selectedEmployee,
        fetchEmployees,
    ]);

    // Close employee dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                employeeSearchRef.current &&
                !employeeSearchRef.current.contains(
                    event.target
                )
            ) {
                setShowEmployeeResults(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: "",
        }));

        setSuccessMessage("");
        setErrorMessage("");
    };

    const handleEmployeeSearch = (value) => {
        setSearch(value);

        // Remove the previously selected employee
        if (formData.assigned_to) {
            setFormData((previous) => ({
                ...previous,
                assigned_to: "",
            }));

            setSelectedEmployee(null);
        }

        setErrors((previous) => ({
            ...previous,
            assigned_to: "",
        }));

        setSuccessMessage("");
        setErrorMessage("");
        setShowEmployeeResults(true);
    };

    const handleEmployeeSelect = (employee) => {
        console.log(
            "Selected employee:",
            employee
        );

        console.log(
            "Passing user_id as assigned_to:",
            employee.user_id
        );

        setFormData((previous) => ({
            ...previous,
            assigned_to: employee.user_id,
        }));

        setSelectedEmployee(employee);

        setSearch(
            `${employee.name || ""} - ${
                employee.employee_id || ""
            }`
        );

        setErrors((previous) => ({
            ...previous,
            assigned_to: "",
        }));

        setShowEmployeeResults(false);
        setSuccessMessage("");
        setErrorMessage("");
    };

    const clearEmployeeSelection = () => {
        setFormData((previous) => ({
            ...previous,
            assigned_to: "",
        }));

        setSelectedEmployee(null);
        setSearch("");

        setErrors((previous) => ({
            ...previous,
            assigned_to: "",
        }));

        setShowEmployeeResults(false);
    };

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
            formData.deadline < formData.start_date
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

    const handleSubmit = async (event) => {
        event.preventDefault();

        /*
         * State updates are asynchronous, so use a ref
         * to immediately block a second API call.
         */
        if (submittingRef.current) {
            return;
        }

        setSuccessMessage("");
        setErrorMessage("");

        if (!validateForm()) {
            return;
        }

        try {
            submittingRef.current = true;
            setSubmitting(true);

            const payload = {
                title: formData.title.trim(),
                description:
                    formData.description.trim(),

                assigned_to: Number(
                    formData.assigned_to
                ),

                start_date: formData.start_date,
                deadline: formData.deadline,
                priority: formData.priority,
            };

            console.log(
                "Task request payload:",
                payload
            );

            const response =
                await createTask(payload);

            console.log(
                "Task created:",
                response
            );

            setSuccessMessage(
                "Task assigned successfully!"
            );

            setFormData(initialFormData);
            setSearch("");
            setSelectedEmployee(null);
            setErrors({});
            setShowEmployeeResults(false);
        } catch (error) {
            console.error(
                "Error creating task:",
                error
            );

            const backendError =
                error?.response?.data;

            if (
                typeof backendError === "string"
            ) {
                setErrorMessage(backendError);
            } else if (
                backendError?.detail
            ) {
                setErrorMessage(
                    Array.isArray(backendError.detail)
                        ? backendError.detail[0]
                        : backendError.detail
                );
            } else if (backendError) {
                setErrorMessage(
                    Object.values(backendError)
                        .flat()
                        .join(" ")
                );
            } else {
                setErrorMessage(
                    "Failed to assign task. Please try again."
                );
            }
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    const handleClear = () => {
        setFormData(initialFormData);
        setSearch("");
        setSelectedEmployee(null);
        setErrors({});
        setSuccessMessage("");
        setErrorMessage("");
        setShowEmployeeResults(false);
    };

    return (
        <div className="min-h-full bg-gray-50 p-6">
            {/* Page heading */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-ettm-blue">
                    Assign Task
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Create a task and assign it to an
                    employee.
                </p>
            </div>

            {/* Success message */}
            {successMessage && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {successMessage}
                </div>
            )}

            {/* Error message */}
            {errorMessage && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Task details */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Task Details
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Enter the basic information for
                            the task.
                        </p>
                    </div>

                    {/* Task title */}
                    <div className="mb-5">
                        <label
                            htmlFor="title"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Task Title{" "}
                            <span className="text-red-500">
                                *
                            </span>
                        </label>

                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter task title"
                            className={`w-full rounded-lg border px-4 py-3 text-sm outline-none ${
                                errors.title
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

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="description"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Description{" "}
                            <span className="text-red-500">
                                *
                            </span>
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            rows={5}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe the task..."
                            className={`w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none ${
                                errors.description
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

                {/* Employee assignment */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Assignment
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Search by employee name, employee
                            ID, or designation.
                        </p>
                    </div>

                    <div
                        ref={employeeSearchRef}
                        className="relative"
                    >
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Search Employee
                        </label>

                        <input
                            type="text"
                            value={search}
                            placeholder="Search name, Employee ID or designation..."
                            onFocus={() =>
                                setShowEmployeeResults(true)
                            }
                            onChange={(event) =>
                                handleEmployeeSearch(
                                    event.target.value
                                )
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
                        />

                        {showEmployeeResults && (
                            <div className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                                {loadingEmployees ? (
                                    <div className="px-4 py-6 text-center">
                                        <p className="text-sm text-gray-500">
                                            Searching
                                            employees...
                                        </p>
                                    </div>
                                ) : employees.length > 0 ? (
                                    <>
                                        <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
                                            <p className="text-xs font-medium text-gray-500">
                                                {
                                                    employees.length
                                                }{" "}
                                                employee
                                                {employees.length !==
                                                1
                                                    ? "s"
                                                    : ""}{" "}
                                                found
                                            </p>
                                        </div>

                                        {employees.map(
                                            (employee) => (
                                                <button
                                                    key={
                                                        employee.user_id ||
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
                                                            {employee.designation ||
                                                                "-"}
                                                        </p>
                                                    </div>

                                                    <span className="text-xs font-medium text-ettm-blue">
                                                        Select
                                                    </span>
                                                </button>
                                            )
                                        )}
                                    </>
                                ) : (
                                    <div className="px-4 py-6 text-center">
                                        <p className="text-sm font-medium text-gray-500">
                                            No employees found
                                        </p>

                                        {search && (
                                            <p className="mt-1 text-xs text-gray-400">
                                                No employee
                                                matched "
                                                {search}".
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            Search runs across all employees.
                        </p>

                        {search && (
                            <button
                                type="button"
                                onClick={
                                    clearEmployeeSelection
                                }
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

                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
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
                                        User ID
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {
                                            selectedEmployee.user_id
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Designation
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {selectedEmployee.designation ||
                                            "-"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Schedule */}
                <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Schedule & Priority
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                        {/* Start date */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Start Date *
                            </label>

                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                className={`w-full rounded-lg border px-4 py-3 text-sm ${
                                    errors.start_date
                                        ? "border-red-400"
                                        : "border-gray-300"
                                }`}
                            />

                            {errors.start_date && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.start_date}
                                </p>
                            )}
                        </div>

                        {/* Deadline */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Deadline *
                            </label>

                            <input
                                type="date"
                                name="deadline"
                                min={
                                    formData.start_date ||
                                    undefined
                                }
                                value={formData.deadline}
                                onChange={handleChange}
                                className={`w-full rounded-lg border px-4 py-3 text-sm ${
                                    errors.deadline
                                        ? "border-red-400"
                                        : "border-gray-300"
                                }`}
                            />

                            {errors.deadline && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.deadline}
                                </p>
                            )}
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Priority *
                            </label>

                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className={`w-full rounded-lg border bg-white px-4 py-3 text-sm ${
                                    errors.priority
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
                                    {errors.priority}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={submitting}
                        className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Clear
                    </button>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-ettm-blue px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
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