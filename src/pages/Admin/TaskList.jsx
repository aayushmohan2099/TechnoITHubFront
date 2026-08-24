import React, { useEffect, useState } from "react";
import { getAllTasks } from "../../api/employeeApi";

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");

    const [selectedTask, setSelectedTask] = useState(null);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAllTasks();

            console.log("Task List Response:", data);

            if (Array.isArray(data)) {
                setTasks(data);
            } else if (Array.isArray(data?.results)) {
                setTasks(data.results);
            } else {
                setTasks([]);
            }
        } catch (err) {
            console.error("Task List Error:", err);

            setError(
                err?.response?.data?.detail ||
                "Failed to load tasks."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    // Search + filters
    const filteredTasks = tasks.filter((task) => {
        const searchText = search.toLowerCase();

        const matchesSearch =
            task.title?.toLowerCase().includes(searchText) ||
            task.assigned_to_name?.toLowerCase().includes(searchText) ||
            task.assigned_to_emp_id?.toLowerCase().includes(searchText);

        const matchesStatus =
            !status ||
            task.status?.toLowerCase() === status.toLowerCase();

        const matchesPriority =
            !priority ||
            task.priority?.toLowerCase() === priority.toLowerCase();

        return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority
        );
    });

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

    return (
        <div className="min-h-full bg-gray-50 p-6">

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ettm-blue">
                        Task List
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        View all tasks assigned to employees.
                    </p>
                </div>

                <button
                    onClick={fetchTasks}
                    disabled={loading}
                    className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                    {/* Search */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Search
                        </label>

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Task, employee name or ID..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Status
                        </label>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
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

                    {/* Priority */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Priority
                        </label>

                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
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
            </div>

            {/* Task Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        All Tasks
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                        {filteredTasks.length} task
                        {filteredTasks.length !== 1 ? "s" : ""}
                    </p>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-sm text-gray-500">
                        Loading tasks...
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-sm font-medium text-gray-700">
                            No tasks found
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                            Try changing your search or filters.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1000px]">

                            <thead className="bg-gray-50">
                                <tr>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Task
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Assigned To
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Start Date
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Deadline
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Priority
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-gray-500">
                                        Action
                                    </th>

                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {filteredTasks.map((task) => (
                                    <tr
                                        key={task.id}
                                        className="hover:bg-gray-50"
                                    >

                                        {/* Task */}
                                        <td className="px-5 py-4">

                                            <p className="max-w-xs truncate text-sm font-semibold text-gray-800">
                                                {task.title}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-400">
                                                Task #{task.id}
                                            </p>

                                        </td>

                                        {/* Employee */}
                                        <td className="px-5 py-4">

                                            <p className="text-sm font-medium text-gray-800">
                                                {task.assigned_to_name}
                                            </p>

                                            <p className="mt-1 text-xs text-gray-500">
                                                {task.assigned_to_emp_id}
                                            </p>

                                        </td>

                                        {/* Start Date */}
                                        <td className="px-5 py-4 text-sm text-gray-600">
                                            {formatDate(task.start_date)}
                                        </td>

                                        {/* Deadline */}
                                        <td className="px-5 py-4 text-sm text-gray-600">
                                            {formatDate(task.deadline)}
                                        </td>

                                        {/* Priority */}
                                        <td className="px-5 py-4">

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${priorityClass(
                                                    task.priority
                                                )}`}
                                            >
                                                {task.priority}
                                            </span>

                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-4">

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                                                    task.status
                                                )}`}
                                            >
                                                {task.status}
                                            </span>

                                        </td>

                                        {/* View */}
                                        <td className="px-5 py-4 text-center">

                                            <button
                                                onClick={() =>
                                                    setSelectedTask(task)
                                                }
                                                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                            >
                                                View
                                            </button>

                                        </td>

                                    </tr>
                                ))}

                            </tbody>

                        </table>

                    </div>
                )}
            </div>

            {/* Task Details Modal */}
            {selectedTask && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setSelectedTask(null)}
                >

                    <div
                        className="w-full max-w-2xl rounded-xl bg-white shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="flex items-center justify-between border-b px-6 py-4">

                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Task Details
                                </h2>

                                <p className="text-xs text-gray-500">
                                    Task #{selectedTask.id}
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedTask(null)}
                                className="text-2xl text-gray-400 hover:text-gray-700"
                            >
                                ×
                            </button>

                        </div>

                        <div className="space-y-5 px-6 py-6">

                            <div>
                                <p className="text-xs text-gray-400">
                                    Title
                                </p>

                                <p className="mt-1 text-base font-semibold text-gray-800">
                                    {selectedTask.title}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400">
                                    Description
                                </p>

                                <p className="mt-1 text-sm leading-6 text-gray-700">
                                    {selectedTask.description || "-"}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Employee
                                    </p>

                                    <p className="mt-1 text-sm font-semibold">
                                        {selectedTask.assigned_to_name}
                                    </p>

                                    <p className="text-xs text-gray-500">
                                        {selectedTask.assigned_to_emp_id}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Created By
                                    </p>

                                    <p className="mt-1 text-sm font-semibold">
                                        {selectedTask.created_by_name}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Start Date
                                    </p>

                                    <p className="mt-1 text-sm">
                                        {formatDate(selectedTask.start_date)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Deadline
                                    </p>

                                    <p className="mt-1 text-sm">
                                        {formatDate(selectedTask.deadline)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Priority
                                    </p>

                                    <span
                                        className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${priorityClass(
                                            selectedTask.priority
                                        )}`}
                                    >
                                        {selectedTask.priority}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Status
                                    </p>

                                    <span
                                        className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                                            selectedTask.status
                                        )}`}
                                    >
                                        {selectedTask.status}
                                    </span>
                                </div>

                            </div>

                        </div>

                        <div className="flex justify-end border-t px-6 py-4">

                            <button
                                onClick={() => setSelectedTask(null)}
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