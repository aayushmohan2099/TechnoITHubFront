import React, { useEffect, useMemo, useState } from "react";
import { getAllTasks } from "../../api/employeeApi";

const TaskList = () => {
    const [tasks, setTasks] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // --------------------------------------------------
    // Backend Search
    // --------------------------------------------------
    const [search, setSearch] = useState("");

    // --------------------------------------------------
    // Frontend Filters
    // --------------------------------------------------
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------
    const [page, setPage] = useState(1);

    const [totalCount, setTotalCount] = useState(0);

    const [nextPage, setNextPage] = useState(null);

    const [previousPage, setPreviousPage] = useState(null);

    const [selectedEmployee, setSelectedEmployee] =
        useState(null);
    const [taskTab, setTaskTab] = useState("open");

    // --------------------------------------------------
    // Fetch Tasks
    // --------------------------------------------------
    const fetchTasks = async (
        pageNumber = 1,
        searchValue = ""
    ) => {
        try {
            setLoading(true);
            setError("");

            let allTasks = [];
            let currentPage = pageNumber;

            const data = await getAllTasks({
                page: currentPage,
                search: searchValue.trim(),
                page_size: 100,
            });

            const pageResults = Array.isArray(data?.results)
                ? data.results
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data)
                        ? data
                        : []; 

            allTasks = [...allTasks, ...pageResults];

            setTasks(allTasks);
            setNextPage(null);
            setPreviousPage(null);

        } catch (err) {
            console.error(
                "Task List Error:",
                err
            );

            setTasks([]);
            setTotalCount(0);
            setNextPage(null);
            setPreviousPage(null);

            setError(
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                "Failed to load tasks."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks(1, "");
    }, []);

    const normalizedTasks = useMemo(() => {
        return tasks.filter((task) => {
            const matchesStatus =
                !status ||
                task.status
                    ?.toLowerCase() ===
                status.toLowerCase();

            const matchesPriority =
                !priority ||
                task.priority
                    ?.toLowerCase() ===
                priority.toLowerCase();

            return matchesStatus && matchesPriority;
        });
    }, [tasks, status, priority]);

    const employeeRows = useMemo(() => {
        const grouped = new Map();

        normalizedTasks.forEach((task) => {
            const employeeId =
                task.assigned_to_emp_id ||
                task.employee_id ||
                task.assigned_to ||
                task.assigned_to_name ||
                "unknown";

            const employeeName =
                task.assigned_to_name || "Unknown Employee";

            if (!grouped.has(employeeId)) {
                grouped.set(employeeId, {
                    employeeId,
                    employeeName,
                    tasks: [],
                    creators: new Set(),
                });
            }

            const employeeGroup = grouped.get(employeeId);
            employeeGroup.tasks.push(task);

            if (task.created_by_name) {
                employeeGroup.creators.add(task.created_by_name);
            }
        });

        return Array.from(grouped.values()).map((group) => {
            const creators = [...group.creators].filter(Boolean);
            const createdBy = creators.length > 1
                ? `${creators.length} creators`
                : creators[0] || "Unknown";

            return {
                ...group,
                createdBy,
            };
        });
    }, [normalizedTasks]);

    const pageSize = 10;
    const totalEmployeeCount = employeeRows.length;
    const totalPages = Math.max(1, Math.ceil(totalEmployeeCount / pageSize));
    const currentPageRows = employeeRows.slice(
        (page - 1) * pageSize,
        page * pageSize
    );
    const startTask = totalEmployeeCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const endTask = Math.min(page * pageSize, totalEmployeeCount);

    useEffect(() => {
        setTotalCount(totalEmployeeCount);
        setNextPage(totalEmployeeCount > page * pageSize ? "next" : null);
        setPreviousPage(page > 1 ? "previous" : null);
    }, [employeeRows, totalEmployeeCount, page]);

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const priorityClass = (value) => {
        switch (value?.toLowerCase()) {
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

    const statusClass = (value) => {
        switch (value?.toLowerCase()) {
            case "pending":
                return "bg-yellow-100 text-yellow-700";

            case "in progress":
                return "bg-blue-100 text-blue-700";

            case "completed":
                return "bg-green-100 text-green-700";

            case "cancelled":
                return "bg-red-100 text-red-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    // --------------------------------------------------
    // Clear Filters
    // --------------------------------------------------
    const handleClearFilters = () => {
        setSearch("");
        setStatus("");
        setPriority("");
        setPage(1);
    };

    return (
        <div className="min-h-full bg-gray-50 p-6">

            {/* ==========================================
                HEADER
            ========================================== */}
            <div className="mb-6 flex items-center justify-between">

                <div>

                    <h1 className="text-2xl font-semibold text-ettm-blue">
                        Task List
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        View all tasks assigned
                        to employees.
                    </p>

                </div>

                <button
                    type="button"
                    onClick={() =>
                        fetchTasks(
                            page,
                            search
                        )
                    }
                    disabled={loading}
                    className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading
                        ? "Refreshing..."
                        : "Refresh"}
                </button>

            </div>

            {/* ==========================================
                ERROR
            ========================================== */}
            {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* ==========================================
                FILTERS
            ========================================== */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                <div className="mb-4 flex items-center justify-between">

                    <div>

                        <h2 className="text-base font-semibold text-gray-800">
                            Search & Filters
                        </h2>

                        <p className="mt-1 text-xs text-gray-500">
                            Search tasks across
                            all pages.
                        </p>

                    </div>

                    {(search ||
                        status ||
                        priority) && (

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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                    {/* SEARCH */}
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
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
                        />

                        {search && (
                            <p className="mt-1 text-xs text-gray-400">
                                Searching for
                                "{search}"
                            </p>
                        )}

                    </div>

                    {/* STATUS */}
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
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-ettm-blue"
                        >

                            <option value="">
                                All Status
                            </option>

                            <option value="Pending">
                                Pending
                            </option>

                            <option value="In Progress">
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

                    {/* PRIORITY */}
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
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-ettm-blue"
                        >

                            <option value="">
                                All Priorities
                            </option>

                            <option value="high">
                                High
                            </option>

                            <option value="medium">
                                Medium
                            </option>

                            <option value="low">
                                Low
                            </option>

                        </select>

                    </div>

                </div>

<div>
                    <button
                    type="button"
                    onClick={() =>
                        fetchTasks(
                            page,
                            search
                        )
                    }
                    disabled={loading}
                    className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading
                        ? "Fetching..."
                        : "Fetch"}
                </button>
</div>

            </div>

            {/* ==========================================
                TASK TABLE
            ========================================== */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">

                    <h2 className="text-lg font-semibold text-gray-800">
                        All Tasks
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                        {totalCount > 0
                            ? `Showing ${startTask}-${endTask} of ${totalCount} tasks`
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

                ) : currentPageRows.length ===
                    0 ? (

                    <div className="py-16 text-center">

                        <p className="text-sm font-medium text-gray-700">
                            No tasks found
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                            Try changing your
                            search or filters.
                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[800px]">

                            <thead className="bg-gray-50">

                                <tr>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Sr. No
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Name
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Created By
                                    </th>

                                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-gray-500">
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {currentPageRows.map(
                                    (employee, index) => (

                                        <tr
                                            key={
                                                employee.employeeId
                                            }
                                            className="hover:bg-gray-50"
                                        >

                                            <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                {(page - 1) * pageSize + index + 1}
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {employee.employeeName || "Unknown Employee"}
                                                </p>
                                                {employee.employeeId && employee.employeeId !== "unknown" && (
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {employee.employeeId}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-700">
                                                {employee.createdBy || "-"}
                                            </td>

                                            <td className="px-5 py-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedEmployee(employee)
                                                    }
                                                    className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                                >
                                                    View Tasks
                                                </button>
                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

                {/* ======================================
                    PAGINATION
                ====================================== */}
                {!loading &&
                    totalCount > 0 && (

                        <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                            <div>

                                <p className="text-sm text-gray-500">
                                    Showing{" "}
                                    <span className="font-medium text-gray-700">
                                        {
                                            startTask
                                        }
                                    </span>
                                    {" - "}
                                    <span className="font-medium text-gray-700">
                                        {
                                            endTask
                                        }
                                    </span>
                                    {" of "}
                                    <span className="font-medium text-gray-700">
                                        {
                                            totalCount
                                        }
                                    </span>
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                    Page {page} of{" "}
                                    {totalPages}
                                </p>

                            </div>

                            <div className="flex gap-2">

                                {/* PREVIOUS */}
                                <button
                                    type="button"
                                    disabled={
                                        !previousPage ||
                                        loading ||
                                        page <= 1
                                    }
                                    onClick={() =>
                                        setPage(
                                            (
                                                current
                                            ) =>
                                                Math.max(
                                                    1,
                                                    current -
                                                    1
                                                )
                                        )
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>

                                {/* PAGE */}
                                <div className="flex min-w-10 items-center justify-center rounded-lg bg-ettm-blue px-4 py-2 text-sm font-semibold text-white">
                                    {page}
                                </div>

                                {/* NEXT */}
                                <button
                                    type="button"
                                    disabled={
                                        !nextPage ||
                                        loading ||
                                        page >=
                                        totalPages
                                    }
                                    onClick={() =>
                                        setPage(
                                            (
                                                current
                                            ) =>
                                                current +
                                                1
                                        )
                                    }
                                    className="rounded-lg bg-ettm-blue px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>

                            </div>

                        </div>

                    )}

            </div>

            {/* ==========================================
                EMPLOYEE TASKS MODAL
            ========================================== */}
            {selectedEmployee && (

                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() =>
                        setSelectedEmployee(null)
                    }
                >

                    <div
                        className="w-full max-w-3xl rounded-xl bg-white shadow-xl"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="flex items-center justify-between border-b px-6 py-4">

                            <div>

                                <h2 className="text-lg font-semibold text-gray-800">
                                    {selectedEmployee.employeeName || "Employee Tasks"}
                                </h2>

                                {selectedEmployee.employeeId && selectedEmployee.employeeId !== "unknown" && (
                                    <p className="text-xs text-gray-500">
                                        {selectedEmployee.employeeId}
                                    </p>
                                )}

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedEmployee(null)
                                }
                                className="text-2xl text-gray-400 hover:text-gray-700"
                            >
                                ×
                            </button>

                        </div>

                        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">

                            {(() => {
                                const completedTasks = selectedEmployee.tasks.filter(
                                    (task) => task.status?.toLowerCase() === "completed"
                                );

                                const openTasks = selectedEmployee.tasks.filter(
                                    (task) => task.status?.toLowerCase() !== "completed"
                                );

                                const tabs = [
                                    { key: "open", label: "Open Tasks", items: openTasks },
                                    { key: "completed", label: "Completed Tasks", items: completedTasks },
                                ];

                                const activeTab = tabs.find((tab) => tab.key === taskTab) || tabs[0];

                                return (
                                    <div className="space-y-4">
                                        <div className="flex gap-2 border-b border-gray-200 pb-3">
                                            {tabs.map((tab) => (
                                                <button
                                                    key={tab.key}
                                                    type="button"
                                                    onClick={() => setTaskTab(tab.key)}
                                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${taskTab === tab.key
                                                        ? "bg-ettm-blue text-white"
                                                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                                                >
                                                    {tab.label}
                                                    {tab.items.length > 0 && (
                                                        <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
                                                            {tab.items.length}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        {activeTab.items.length > 0 ? (
                                            <div className="space-y-3">
                                                {activeTab.items.map((task) => (
                                                    <div
                                                        key={task.id}
                                                        className={`rounded-lg border p-4 ${activeTab.key === "completed" ? "border-gray-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}
                                                    >
                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-semibold text-gray-800">
                                                                    {task.title || "Untitled Task"}
                                                                </p>
                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    Task #{task.id || "-"}
                                                                </p>
                                                            </div>
                                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(task.status)}`}>
                                                                {task.status || "-"}
                                                            </span>
                                                        </div>

                                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                            <div>
                                                                <p className="text-[11px] uppercase tracking-wide text-gray-400">Description</p>
                                                                <p className="mt-1 text-sm text-gray-700">
                                                                    {task.description || "-"}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] uppercase tracking-wide text-gray-400">Priority</p>
                                                                <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${priorityClass(task.priority)}`}>
                                                                    {task.priority || "No Priority"}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] uppercase tracking-wide text-gray-400">Start Date</p>
                                                                <p className="mt-1 text-sm text-gray-700">
                                                                    {formatDate(task.start_date)}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[11px] uppercase tracking-wide text-gray-400">Deadline</p>
                                                                <p className="mt-1 text-sm text-gray-700">
                                                                    {formatDate(task.deadline)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                                                No {activeTab.key === "completed" ? "completed" : "open"} tasks
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                        </div>

                        <div className="flex justify-end border-t px-6 py-4">

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedEmployee(null)
                                }
                                className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};

export default TaskList;