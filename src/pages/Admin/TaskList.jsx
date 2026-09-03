import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    getAllTasks,
    updateTask,
    deleteTask,
} from "../../api/employeeApi";

import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";

import {
    FaArrowUp,
    FaArrowDown,
    FaEdit,
    FaTrash,
} from "react-icons/fa";

const PAGE_SIZE = 10;

const EMPTY_FILTERS = {
    search: "",
    status: "",
    priority: "",
    ordering: "",
};

const EMPTY_EDIT_FORM = {
    title: "",
    description: "",
    assigned_to: "",
    start_date: "",
    deadline: "",
    priority: "",
};

const extractTasks = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.results)) {
        return response.data.results;
    }
    return [];
};

const getErrorMessage = (error) => {
    const backendError = error?.response?.data;

    if (typeof backendError === "string") {
        return backendError;
    }

    if (backendError?.detail) {
        return Array.isArray(backendError.detail)
            ? backendError.detail[0]
            : backendError.detail;
    }

    if (backendError?.message) {
        return Array.isArray(backendError.message)
            ? backendError.message[0]
            : backendError.message;
    }

    if (backendError && typeof backendError === "object") {
        const message = Object.values(backendError)
            .flat()
            .filter(Boolean)
            .join(" ");

        if (message) return message;
    }

    if (!error?.response) {
        return "Unable to connect to the server.";
    }

    return "Something went wrong.";
};

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

const getPriorityClass = (value) => {
    switch (String(value || "").toLowerCase()) {
        case "high":
            return "bg-red-100 text-red-700";
        case "medium":
            return "bg-yellow-100 text-yellow-700";
        case "low":
            return "bg-green-100 text-green-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
};

const getStatusClass = (value) => {
    switch (String(value || "").toLowerCase()) {
        case "pending":
            return "bg-yellow-100 text-yellow-700";

        case "in progress":
        case "in-progress":
        case "in_progress":
            return "bg-blue-100 text-blue-700";

        case "completed":
            return "bg-green-100 text-green-700";

        case "cancelled":
        case "canceled":
            return "bg-red-100 text-red-700";

        default:
            return "bg-gray-100 text-gray-700";
    }
};

const DetailItem = ({ label, value }) => (
    <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {label}
        </p>

        <p className="mt-1 text-sm font-medium text-gray-800">
            {value}
        </p>
    </div>
);

const SortHeader = ({
    label,
    field,
    ordering,
    onSort,
}) => (
    <div className="flex items-center gap-2">
        <span>{label}</span>

        <div className="flex flex-col">
            <button
                type="button"
                title={`Sort ${label} ascending`}
                onClick={(event) => {
                    event.stopPropagation();
                    onSort(field);
                }}
                className={
                    ordering === field
                        ? "text-ettm-blue"
                        : "text-gray-400 hover:text-ettm-blue"
                }
            >
                <FaArrowUp size={10} />
            </button>

            <button
                type="button"
                title={`Sort ${label} descending`}
                onClick={(event) => {
                    event.stopPropagation();
                    onSort(`-${field}`);
                }}
                className={
                    ordering === `-${field}`
                        ? "text-ettm-blue"
                        : "text-gray-400 hover:text-ettm-blue"
                }
            >
                <FaArrowDown size={10} />
            </button>
        </div>
    </div>
);

const FormField = ({
    label,
    error,
    children,
}) => (
    <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
            {label}
        </label>

        {children}

        {error && (
            <p className="mt-1 text-xs text-red-500">
                {error}
            </p>
        )}
    </div>
);

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");
    const [ordering, setOrdering] = useState("");

    const [appliedFilters, setAppliedFilters] =
        useState(EMPTY_FILTERS);

    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);

    const [selectedTask, setSelectedTask] =
        useState(null);

    const [isEditing, setIsEditing] =
        useState(false);

    const [editForm, setEditForm] =
        useState(EMPTY_EDIT_FORM);

    const [editErrors, setEditErrors] =
        useState({});

    const [updatingTask, setUpdatingTask] =
        useState(false);

    const [deletingTask, setDeletingTask] =
        useState(false);

    const initialFetchRef = useRef(false);

    const fetchTasks = useCallback(
        async (
            pageNumber = 1,
            filters = EMPTY_FILTERS
        ) => {
            try {
                setLoading(true);
                setErrorMessage("");

                const response = await getAllTasks({
                    page: pageNumber,
                    search: filters.search || "",
                    status: filters.status || "",
                    priority: filters.priority || "",
                    ordering: filters.ordering || "",
                });

                const results = extractTasks(response);

                setTasks(results);
                setPage(pageNumber);

                if (Array.isArray(response)) {
                    setTotalCount(response.length);
                    setNextPage(null);
                    setPreviousPage(null);
                } else {
                    setTotalCount(
                        response?.count ??
                            response?.data?.count ??
                            results.length
                    );

                    setNextPage(
                        response?.next ??
                            response?.data?.next ??
                            null
                    );

                    setPreviousPage(
                        response?.previous ??
                            response?.data?.previous ??
                            null
                    );
                }
            } catch (error) {
                console.error(
                    "Get All Tasks Error:",
                    error
                );

                setTasks([]);
                setTotalCount(0);
                setNextPage(null);
                setPreviousPage(null);
                setErrorMessage(
                    getErrorMessage(error)
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        if (initialFetchRef.current) return;

        initialFetchRef.current = true;

        fetchTasks(1, EMPTY_FILTERS);
    }, [fetchTasks]);

    const totalPages = Math.max(
        1,
        Math.ceil(totalCount / PAGE_SIZE)
    );

    const startItem =
        tasks.length === 0
            ? 0
            : (page - 1) * PAGE_SIZE + 1;

    const endItem =
        tasks.length === 0
            ? 0
            : startItem + tasks.length - 1;

    const handleSearchSubmit = (event) => {
        event.preventDefault();

        const filters = {
            search: search.trim(),
            status,
            priority,
            ordering,
        };

        setAppliedFilters(filters);
        fetchTasks(1, filters);
    };

    const handleClearFilters = () => {
        setSearch("");
        setStatus("");
        setPriority("");
        setOrdering("");
        setAppliedFilters(EMPTY_FILTERS);

        fetchTasks(1, EMPTY_FILTERS);
    };

    const handleOrdering = (value) => {
        setOrdering(value);

        const filters = {
            ...appliedFilters,
            ordering: value,
        };

        setAppliedFilters(filters);
        fetchTasks(1, filters);
    };

    const handleViewTask = (task) => {
        setSelectedTask(task);
        setIsEditing(false);
        setEditErrors({});
        setErrorMessage("");
        setSuccessMessage("");
    };

    const handleEditTask = () => {
        if (!selectedTask) return;

        setEditForm({
            title: selectedTask.title || "",
            description:
                selectedTask.description || "",
            assigned_to:
                selectedTask.assigned_to || "",
            start_date:
                selectedTask.start_date?.slice(
                    0,
                    10
                ) || "",
            deadline:
                selectedTask.deadline?.slice(
                    0,
                    10
                ) || "",
            priority:
                selectedTask.priority || "",
        });

        setEditErrors({});
        setErrorMessage("");
        setSuccessMessage("");
        setIsEditing(true);
    };

    const handleEditChange = (event) => {
        const { name, value } = event.target;

        setEditForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        setEditErrors((previous) => ({
            ...previous,
            [name]: "",
        }));
    };

    const validateEditForm = () => {
        const errors = {};

        if (!editForm.title.trim()) {
            errors.title =
                "Task title is required.";
        }

        if (!editForm.description.trim()) {
            errors.description =
                "Description is required.";
        }

        if (!editForm.assigned_to) {
            errors.assigned_to =
                "Assigned employee is required.";
        }

        if (!editForm.start_date) {
            errors.start_date =
                "Start date is required.";
        }

        if (!editForm.deadline) {
            errors.deadline =
                "Deadline is required.";
        }

        if (
            editForm.start_date &&
            editForm.deadline &&
            editForm.deadline <
                editForm.start_date
        ) {
            errors.deadline =
                "Deadline cannot be before start date.";
        }

        if (!editForm.priority) {
            errors.priority =
                "Priority is required.";
        }

        setEditErrors(errors);

        return (
            Object.keys(errors).length === 0
        );
    };

    const handleUpdateTask = async () => {
        if (!selectedTask) return;

        if (!validateEditForm()) return;

        try {
            setUpdatingTask(true);
            setErrorMessage("");
            setSuccessMessage("");

            const payload = {
                title: editForm.title.trim(),
                description:
                    editForm.description.trim(),
                assigned_to: Number(
                    editForm.assigned_to
                ),
                start_date:
                    editForm.start_date,
                deadline:
                    editForm.deadline,
                priority:
                    editForm.priority,
            };

            const response =
                await updateTask(
                    selectedTask.id,
                    payload
                );

            setSelectedTask((previous) => ({
                ...previous,
                ...response,
                ...payload,
            }));

            setIsEditing(false);

            await fetchTasks(
                page,
                appliedFilters
            );

            setSuccessMessage(
                "Task updated successfully."
            );
        } catch (error) {
            console.error(
                "Update Task Error:",
                error
            );

            setErrorMessage(
                getErrorMessage(error)
            );
        } finally {
            setUpdatingTask(false);
        }
    };

    const handleDeleteTask = async () => {
        if (!selectedTask) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete "${selectedTask.title}"?`
        );

        if (!confirmed) return;

        try {
            setDeletingTask(true);
            setErrorMessage("");
            setSuccessMessage("");

            await deleteTask(selectedTask.id);

            const targetPage =
                tasks.length === 1 &&
                page > 1
                    ? page - 1
                    : page;

            setSelectedTask(null);
            setIsEditing(false);

            await fetchTasks(
                targetPage,
                appliedFilters
            );

            setSuccessMessage(
                "Task deleted successfully."
            );
        } catch (error) {
            console.error(
                "Delete Task Error:",
                error
            );

            setErrorMessage(
                getErrorMessage(error)
            );
        } finally {
            setDeletingTask(false);
        }
    };

    const columns = [
        {
            key: "serial_number",
            label: "Sr. No.",
            render: (_task, index) =>
                (page - 1) *
                    PAGE_SIZE +
                index +
                1,
        },
        {
            key: "title",
            label: "Task",
            render: (task) => (
                <div>
                    <p className="font-semibold text-gray-800">
                        {task.title ||
                            "Untitled Task"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        Task ID:{" "}
                        {task.id ?? "-"}
                    </p>
                </div>
            ),
        },
        {
            key: "assigned_to_name",
            label: "Assigned To",
            render: (task) => (
                <div>
                    <p className="font-medium text-gray-800">
                        {task.assigned_to_name ||
                            "Unknown Employee"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        {task.assigned_to_emp_id ||
                            "-"}
                    </p>
                </div>
            ),
        },
        {
            key: "created_by_name",
            label: "Created By",
            render: (task) =>
                task.created_by_name || "-",
        },
        {
            key: "start_date",
            label: (
                <SortHeader
                    label="Start Date"
                    field="start_date"
                    ordering={ordering}
                    onSort={handleOrdering}
                />
            ),
            render: (task) =>
                formatDate(task.start_date),
        },
        {
            key: "deadline",
            label: (
                <SortHeader
                    label="Deadline"
                    field="deadline"
                    ordering={ordering}
                    onSort={handleOrdering}
                />
            ),
            render: (task) =>
                formatDate(task.deadline),
        },
        {
            key: "priority",
            label: "Priority",
            render: (task) => (
                <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClass(
                        task.priority
                    )}`}
                >
                    {task.priority || "-"}
                </span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (task) => (
                <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                        task.status
                    )}`}
                >
                    {task.status || "-"}
                </span>
            ),
        },
        {
            key: "actions",
            label: "Action",
            render: (task) => (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        handleViewTask(task);
                    }}
                    className="rounded-lg border border-ettm-blue px-4 py-2 text-xs font-semibold text-ettm-blue transition hover:bg-ettm-blue hover:text-white"
                >
                    View
                </button>
            ),
        },
    ];

    const dailyUpdates =
        selectedTask?.daily_updates || [];

    return (
        <div className="min-h-full bg-gray-50 p-6">

            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ettm-blue">
                        Task List
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        View, edit and manage tasks
                        assigned to employees.
                    </p>
                </div>

                <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                        fetchTasks(
                            page,
                            appliedFilters
                        )
                    }
                    className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                    {loading
                        ? "Refreshing..."
                        : "Refresh"}-
                </button>
            </div>

            {successMessage && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            )}

            {/* Filters */}
            <form
                onSubmit={handleSearchSubmit}
                className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-gray-800">
                            Search & Filters
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                            Search by task, employee
                            name, or employee ID.
                        </p>
                    </div>

                    {(search ||
                        status ||
                        priority ||
                        ordering) && (
                        <button
                            type="button"
                            onClick={
                                handleClearFilters
                            }
                            className="text-sm font-medium text-ettm-blue hover:underline"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Search
                        </label>

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            placeholder="Task, employee name or ID..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-ettm-blue"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Status
                        </label>

                        <select
                            value={status}
                            onChange={(e) =>
                                setStatus(
                                    e.target.value
                                )
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                        >
                            <option value="">
                                All Status
                            </option>
                            <option value="Pending">
                                Pending
                            </option>
                            <option value="In-Progress">
                                In Progress
                            </option>
                            <option value="Completed">
                                Completed
                            </option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Priority
                        </label>

                        <select
                            value={priority}
                            onChange={(e) =>
                                setPriority(
                                    e.target.value
                                )
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
                        >
                            <option value="">
                                All Priorities
                            </option>
                            <option value="High">
                                High
                            </option>
                            <option value="Medium">
                                Medium
                            </option>
                            <option value="Low">
                                Low
                            </option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                        >
                            {loading
                                ? "Searching..."
                                : "Search"}
                        </button>
                    </div>
                </div>
            </form>

            {/* Table */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        All Tasks
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                        {totalCount
                            ? `Showing ${startItem}-${endItem} of ${totalCount} tasks`
                            : "No tasks found"}
                    </p>
                </div>

                {loading ? (
                    <div className="py-16 text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-ettm-blue" />

                        <p className="mt-3 text-sm text-gray-500">
                            Loading tasks...
                        </p>
                    </div>
                ) : (
                    <Table
                        columns={columns}
                        data={tasks}
                        keyField="id"
                        emptyMessage="No tasks found. Try changing your filters."
                        onRowClick={
                            handleViewTask
                        }
                        className="rounded-none border-0"
                    />
                )}

                {!loading &&
                    totalCount > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Showing{" "}
                                    {startItem} -{" "}
                                    {endItem} of{" "}
                                    {totalCount}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    Page {page} of{" "}
                                    {totalPages}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={
                                        !previousPage ||
                                        loading ||
                                        page <= 1
                                    }
                                    onClick={() =>
                                        fetchTasks(
                                            page - 1,
                                            appliedFilters
                                        )
                                    }
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:opacity-40"
                                >
                                    Previous
                                </button>

                                <div className="rounded-lg bg-ettm-blue px-4 py-2 text-sm font-semibold text-white">
                                    {page}
                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        !nextPage ||
                                        loading
                                    }
                                    onClick={() =>
                                        fetchTasks(
                                            page + 1,
                                            appliedFilters
                                        )
                                    }
                                    className="rounded-lg bg-ettm-blue px-4 py-2 text-sm text-white disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={Boolean(selectedTask)}
                title={
                    isEditing
                        ? "Edit Task"
                        : "Task Details"
                }
                size="large"
                onClose={() => {
                    if (
                        updatingTask ||
                        deletingTask
                    ) {
                        return;
                    }

                    setSelectedTask(null);
                    setIsEditing(false);
                    setEditErrors({});
                }}
            >
                {selectedTask &&
                    (isEditing ? (
                        <div className="space-y-5">
                            <FormField
                                label="Task Title *"
                                error={
                                    editErrors.title
                                }
                            >
                                <input
                                    type="text"
                                    name="title"
                                    value={
                                        editForm.title
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                                />
                            </FormField>

                            <FormField
                                label="Description *"
                                error={
                                    editErrors.description
                                }
                            >
                                <textarea
                                    name="description"
                                    rows={5}
                                    value={
                                        editForm.description
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm"
                                />
                            </FormField>

                            <div className="rounded-lg bg-gray-50 p-4">
                                <DetailItem
                                    label="Assigned Employee"
                                    value={`${selectedTask.assigned_to_name || "-"} (${selectedTask.assigned_to_emp_id || "-"})`}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <FormField
                                    label="Start Date *"
                                    error={
                                        editErrors.start_date
                                    }
                                >
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={
                                            editForm.start_date
                                        }
                                        onChange={
                                            handleEditChange
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                                    />
                                </FormField>

                                <FormField
                                    label="Deadline *"
                                    error={
                                        editErrors.deadline
                                    }
                                >
                                    <input
                                        type="date"
                                        name="deadline"
                                        min={
                                            editForm.start_date ||
                                            undefined
                                        }
                                        value={
                                            editForm.deadline
                                        }
                                        onChange={
                                            handleEditChange
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm"
                                    />
                                </FormField>

                                <FormField
                                    label="Priority *"
                                    error={
                                        editErrors.priority
                                    }
                                >
                                    <select
                                        name="priority"
                                        value={
                                            editForm.priority
                                        }
                                        onChange={
                                            handleEditChange
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm"
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
                                </FormField>
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsEditing(
                                            false
                                        )
                                    }
                                    disabled={
                                        updatingTask
                                    }
                                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleUpdateTask
                                    }
                                    disabled={
                                        updatingTask
                                    }
                                    className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm text-white disabled:opacity-50"
                                >
                                    {updatingTask
                                        ? "Updating..."
                                        : "Update Task"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {selectedTask.title ||
                                            "Untitled Task"}
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Task ID:{" "}
                                        {selectedTask.id ??
                                            "-"}
                                    </p>
                                </div>

                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                        selectedTask.status
                                    )}`}
                                >
                                    {selectedTask.status ||
                                        "-"}
                                </span>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase text-gray-400">
                                    Description
                                </p>

                                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                                    {selectedTask.description ||
                                        "-"}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
                                <DetailItem
                                    label="Assigned Employee"
                                    value={
                                        selectedTask.assigned_to_name ||
                                        "-"
                                    }
                                />

                                <DetailItem
                                    label="Employee ID"
                                    value={
                                        selectedTask.assigned_to_emp_id ||
                                        "-"
                                    }
                                />

                                <DetailItem
                                    label="Created By"
                                    value={
                                        selectedTask.created_by_name ||
                                        "-"
                                    }
                                />

                                <DetailItem
                                    label="Priority"
                                    value={
                                        selectedTask.priority ||
                                        "-"
                                    }
                                />

                                <DetailItem
                                    label="Start Date"
                                    value={formatDate(
                                        selectedTask.start_date
                                    )}
                                />

                                <DetailItem
                                    label="Deadline"
                                    value={formatDate(
                                        selectedTask.deadline
                                    )}
                                />

                                <DetailItem
                                    label="Created At"
                                    value={formatDateTime(
                                        selectedTask.created_at
                                    )}
                                />

                                <DetailItem
                                    label="Updated At"
                                    value={formatDateTime(
                                        selectedTask.updated_at
                                    )}
                                />
                            </div>

                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="font-semibold text-gray-800">
                                        Daily Updates
                                    </h4>

                                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                                        {dailyUpdates.length}{" "}
                                        update
                                        {dailyUpdates.length !==
                                        1
                                            ? "s"
                                            : ""}
                                    </span>
                                </div>

                                {dailyUpdates.length >
                                0 ? (
                                    <div className="space-y-3">
                                        {dailyUpdates.map(
                                            (
                                                update,
                                                index
                                            ) => {
                                                const progress =
                                                    Math.min(
                                                        100,
                                                        Math.max(
                                                            0,
                                                            Number(
                                                                update.progress_percent ||
                                                                    0
                                                            )
                                                        )
                                                    );

                                                return (
                                                    <div
                                                        key={
                                                            update.id ||
                                                            index
                                                        }
                                                        className="rounded-lg border border-gray-200 p-4"
                                                    >
                                                        <div className="flex justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-800">
                                                                    {update.task_title ||
                                                                        `Update ${
                                                                            index +
                                                                            1
                                                                        }`}
                                                                </p>

                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    Updated
                                                                    by:{" "}
                                                                    {update.employee_name ||
                                                                        "-"}
                                                                </p>
                                                            </div>

                                                            <span
                                                                className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                                    update.task_status
                                                                )}`}
                                                            >
                                                                {update.task_status ||
                                                                    "-"}
                                                            </span>
                                                        </div>

                                                        <p className="mt-4 text-sm text-gray-700">
                                                            {update.update_text ||
                                                                "No update text provided."}
                                                        </p>

                                                        <div className="mt-4">
                                                            <div className="mb-2 flex justify-between text-xs">
                                                                <span>
                                                                    Progress
                                                                </span>

                                                                <span className="font-semibold text-ettm-blue">
                                                                    {
                                                                        progress
                                                                    }
                                                                    %
                                                                </span>
                                                            </div>

                                                            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                                                                <div
                                                                    className="h-full bg-ettm-blue"
                                                                    style={{
                                                                        width: `${progress}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <p className="mt-4 border-t pt-3 text-xs text-gray-400">
                                                            Updated:{" "}
                                                            {formatDateTime(
                                                                update.created_at ||
                                                                    update.updated_at
                                                            )}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm text-gray-500">
                                        No daily updates
                                        have been added.
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={
                                        handleDeleteTask
                                    }
                                    disabled={
                                        deletingTask
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm text-white disabled:opacity-50"
                                >
                                    <FaTrash />

                                    {deletingTask
                                        ? "Deleting..."
                                        : "Delete"}
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleEditTask
                                    }
                                    className="inline-flex items-center gap-2 rounded-lg border border-ettm-blue px-5 py-2.5 text-sm text-ettm-blue"
                                >
                                    <FaEdit />
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedTask(
                                            null
                                        )
                                    }
                                    className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm text-white"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    ))}
            </Modal>
        </div>
    );
};

export default TaskList;