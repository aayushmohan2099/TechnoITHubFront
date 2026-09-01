import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { getAllTasks } from "../../api/employeeApi";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";

const PAGE_SIZE = 10;

const extractTasks = (response) => {
    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.results)) {
        return response.results;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.data?.results)) {
        return response.data.results;
    }

    return [];
};

// Makes "In Progress", "In-Progress" and "In_Progress" equal
const normalizeFilterValue = (value) => {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "");
};

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");

    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);

    const [selectedTask, setSelectedTask] = useState(null);

    // Prevent duplicate initial API call in development
    const initialFetchRef = useRef(false);

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

        if (!error?.response) {
            return "Unable to connect to the server.";
        }

        return "Failed to load tasks.";
    };

    const fetchTasks = useCallback(
        async (pageNumber = 1, searchValue = "") => {
            try {
                setLoading(true);
                setErrorMessage("");

                const response = await getAllTasks({
                    page: pageNumber,
                    search: searchValue.trim(),
                });

                console.log("Get All Tasks Response:", response);

                const taskResults = extractTasks(response);

                setTasks(taskResults);
                setPage(pageNumber);

                if (Array.isArray(response)) {
                    setTotalCount(response.length);
                    setNextPage(null);
                    setPreviousPage(null);
                } else {
                    setTotalCount(
                        response?.count ??
                            response?.data?.count ??
                            taskResults.length
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
                console.error("Get All Tasks Error:", error);

                setTasks([]);
                setTotalCount(0);
                setNextPage(null);
                setPreviousPage(null);
                setErrorMessage(getErrorMessage(error));
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        if (initialFetchRef.current) {
            return;
        }

        initialFetchRef.current = true;
        fetchTasks(1, "");
    }, [fetchTasks]);

    // Status and priority are filtered on the frontend
    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const matchesStatus =
                !status ||
                normalizeFilterValue(task.status) ===
                    normalizeFilterValue(status);

            const matchesPriority =
                !priority ||
                normalizeFilterValue(task.priority) ===
                    normalizeFilterValue(priority);

            return matchesStatus && matchesPriority;
        });
    }, [tasks, status, priority]);

    const totalPages = Math.max(
        1,
        Math.ceil(totalCount / PAGE_SIZE)
    );

    const startItem =
        filteredTasks.length === 0
            ? 0
            : (page - 1) * PAGE_SIZE + 1;

    const endItem =
        filteredTasks.length === 0
            ? 0
            : startItem + filteredTasks.length - 1;

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        fetchTasks(1, search);
    };

    const handleClearFilters = () => {
        setSearch("");
        setStatus("");
        setPriority("");
        fetchTasks(1, "");
    };

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateTime = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
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
        switch (normalizeFilterValue(value)) {
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
        switch (normalizeFilterValue(value)) {
            case "pending":
                return "bg-yellow-100 text-yellow-700";

            case "inprogress":
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

    const columns = [
        {
            key: "serial_number",
            label: "Sr. No.",
            render: (_task, rowIndex) =>
                (page - 1) * PAGE_SIZE + rowIndex + 1,
        },
        {
            key: "title",
            label: "Task",
            render: (task) => (
                <div>
                    <p className="font-semibold text-gray-800">
                        {task.title || "Untitled Task"}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                        Task ID: {task.id ?? "-"}
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
                        {task.assigned_to_emp_id || "-"}
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
            label: "Start Date",
            render: (task) =>
                formatDate(task.start_date),
        },
        {
            key: "deadline",
            label: "Deadline",
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
                        setSelectedTask(task);
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
                        View all tasks assigned to employees.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => fetchTasks(page, search)}
                    disabled={loading}
                    className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading
                        ? "Refreshing..."
                        : "Refresh"}
                </button>
            </div>

            {/* Error message */}
            {errorMessage && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            )}

            {/* Search and filters */}
            <form
                onSubmit={handleSearchSubmit}
                className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">
                            Search & Filters
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                            Search by task, employee name, or
                            employee ID.
                        </p>
                    </div>

                    {(search || status || priority) && (
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="text-sm font-medium text-ettm-blue hover:underline"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {/* Search */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Search
                        </label>

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Task, employee name or ID..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
                        />
                    </div>

                    {/* Status frontend filter */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Status
                        </label>

                        <select
                            value={status}
                            onChange={(event) =>
                                setStatus(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-ettm-blue"
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

                            <option value="Cancelled">
                                Cancelled
                            </option>
                        </select>
                    </div>

                    {/* Priority frontend filter */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Priority
                        </label>

                        <select
                            value={priority}
                            onChange={(event) =>
                                setPriority(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-ettm-blue"
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
                            className="w-full rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Searching..."
                                : "Search"}
                        </button>
                    </div>
                </div>
            </form>

            {/* Task table */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-5 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        All Tasks
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                        {status || priority
                            ? `${filteredTasks.length} filtered task${
                                  filteredTasks.length !== 1
                                      ? "s"
                                      : ""
                              } found on this page`
                            : totalCount > 0
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
                        data={filteredTasks}
                        keyField="id"
                        emptyMessage="No tasks found. Try changing your filters."
                        onRowClick={setSelectedTask}
                        className="rounded-none border-0"
                    />
                )}

                {/* Pagination */}
                {!loading && totalCount > 0 && (
                    <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                Page{" "}
                                <span className="font-medium text-gray-700">
                                    {page}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium text-gray-700">
                                    {totalPages}
                                </span>
                            </p>

                            {(status || priority) && (
                                <p className="mt-1 text-xs text-gray-400">
                                    Filters are applied to the
                                    current page.
                                </p>
                            )}
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
                                        Math.max(1, page - 1),
                                        search
                                    )
                                }
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <div className="flex min-w-10 items-center justify-center rounded-lg bg-ettm-blue px-4 py-2 text-sm font-semibold text-white">
                                {page}
                            </div>

                            <button
                                type="button"
                                disabled={!nextPage || loading}
                                onClick={() =>
                                    fetchTasks(
                                        page + 1,
                                        search
                                    )
                                }
                                className="rounded-lg bg-ettm-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Task details modal */}
            <Modal
                isOpen={Boolean(selectedTask)}
                onClose={() => setSelectedTask(null)}
                title="Task Details"
                size="large"
            >
                {selectedTask && (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {selectedTask.title ||
                                        "Untitled Task"}
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Task ID:{" "}
                                    {selectedTask.id ?? "-"}
                                </p>
                            </div>

                            <span
                                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                    selectedTask.status
                                )}`}
                            >
                                {selectedTask.status || "-"}
                            </span>
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Description
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                {selectedTask.description || "-"}
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
                                    selectedTask.priority || "-"
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

                        {/* Daily updates */}
                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-base font-semibold text-gray-800">
                                    Daily Updates
                                </h4>

                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                    {dailyUpdates.length} update
                                    {dailyUpdates.length !== 1
                                        ? "s"
                                        : ""}
                                </span>
                            </div>

                            {dailyUpdates.length > 0 ? (
                                <div className="space-y-3">
                                    {dailyUpdates.map(
                                        (update, index) => {
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
                                                    className="rounded-lg border border-gray-200 bg-white p-4"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
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
                                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                                update.task_status
                                                            )}`}
                                                        >
                                                            {update.task_status ||
                                                                "-"}
                                                        </span>
                                                    </div>

                                                    <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
                                                        {update.update_text ||
                                                            "No update text provided."}
                                                    </p>

                                                    <div className="mt-4">
                                                        <div className="mb-2 flex justify-between text-xs">
                                                            <span className="font-medium text-gray-500">
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
                                                                className="h-full rounded-full bg-ettm-blue"
                                                                style={{
                                                                    width: `${progress}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
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
                                    No daily updates have been
                                    added.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end border-t border-gray-200 pt-4">
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedTask(null)
                                }
                                className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const DetailItem = ({ label, value }) => {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {label}
            </p>

            <p className="mt-1 text-sm font-medium text-gray-800">
                {value}
            </p>
        </div>
    );
};

export default TaskList;