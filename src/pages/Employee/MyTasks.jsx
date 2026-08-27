import React, { useEffect, useState } from "react";
import {
    getMyTasks,
    updateTaskProgress,
} from "../../api/employeeApi";

const MyTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Selected task for progress update
    const [selectedTask, setSelectedTask] =
        useState(null);

    // Progress update form
    const [updateText, setUpdateText] =
        useState("");

    const [progressPercent, setProgressPercent] =
        useState("");

    const [updating, setUpdating] =
        useState(false);

    const [updateError, setUpdateError] =
        useState("");

    const [updateSuccess, setUpdateSuccess] =
        useState("");

    // --------------------------------------------------
    // Fetch Employee Tasks
    // --------------------------------------------------
    const fetchMyTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getMyTasks();

            console.log(
                "My Tasks Response:",
                data
            );

            if (Array.isArray(data)) {
                setTasks(data);
            } else if (
                Array.isArray(data?.results)
            ) {
                setTasks(data.results);
            } else {
                setTasks([]);
            }
        } catch (err) {
            console.error(
                "My Tasks Error:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Failed to load your tasks."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyTasks();
    }, []);

    // --------------------------------------------------
    // Format Date
    // --------------------------------------------------
    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(
            date
        ).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // --------------------------------------------------
    // Priority Styling
    // --------------------------------------------------
    const priorityClass = (priority) => {
        switch (
        priority?.toLowerCase()
        ) {
            case "high":
                return "bg-red-100 text-red-700";

            case "medium":
                return "bg-yellow-100 text-yellow-700";

            case "low":
                return "bg-green-100 text-green-700";

            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    // --------------------------------------------------
    // Status Styling
    // --------------------------------------------------
    const statusClass = (status) => {
        switch (
        status?.toLowerCase()
        ) {
            case "pending":
                return "bg-yellow-100 text-yellow-700";

            case "in progress":
                return "bg-blue-100 text-blue-700";

            case "completed":
                return "bg-green-100 text-green-700";

            case "cancelled":
                return "bg-red-100 text-red-700";

            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    // --------------------------------------------------
    // Open Progress Modal
    // --------------------------------------------------
    const openProgressModal = (task) => {
        console.log(
            "Selected Task:",
            task
        );

        console.log(
            "Selected Task ID:",
            task.id
        );

        setSelectedTask(task);

        setUpdateText("");

        setProgressPercent("");

        setUpdateError("");

        setUpdateSuccess("");
    };

    // --------------------------------------------------
    // Close Progress Modal
    // --------------------------------------------------
    const closeProgressModal = () => {
        if (updating) {
            return;
        }

        setSelectedTask(null);

        setUpdateText("");

        setProgressPercent("");

        setUpdateError("");

        setUpdateSuccess("");
    };

    // --------------------------------------------------
    // Submit Task Progress
    // --------------------------------------------------
    const handleTaskUpdate = async (e) => {
        e.preventDefault();

        setUpdateError("");
        setUpdateSuccess("");

        if (!selectedTask) {
            setUpdateError(
                "Please select a task."
            );

            return;
        }

        if (!updateText.trim()) {
            setUpdateError(
                "Please enter your progress update."
            );

            return;
        }

        if (progressPercent === "") {
            setUpdateError(
                "Please enter progress percentage."
            );

            return;
        }

        const progress = Number(
            progressPercent
        );

        if (
            Number.isNaN(progress) ||
            progress < 0 ||
            progress > 100
        ) {
            setUpdateError(
                "Progress percentage must be between 0 and 100."
            );

            return;
        }

        try {
            setUpdating(true);

            const payload = {
                update_text:
                    updateText.trim(),

                progress_percent:
                    progress,
            };

            console.log(
                "Task ID:",
                selectedTask.id
            );

            console.log(
                "Task Update Payload:",
                payload
            );

            const response =
                await updateTaskProgress(
                    selectedTask.id,
                    payload
                );

            console.log(
                "Task Update Response:",
                response
            );

            setUpdateSuccess(
                "Task progress updated successfully!"
            );

            setUpdateText("");

            setProgressPercent("");

            // Refresh task list
            await fetchMyTasks();

        } catch (err) {
            console.error(
                "Task Progress Update Error:",
                err
            );

            const backendError =
                err?.response?.data;

            if (
                typeof backendError ===
                "string"
            ) {
                setUpdateError(
                    backendError
                );
            } else if (
                backendError?.detail
            ) {
                setUpdateError(
                    backendError.detail
                );
            } else if (
                backendError?.message
            ) {
                setUpdateError(
                    backendError.message
                );
            } else if (backendError) {
                setUpdateError(
                    Object.values(
                        backendError
                    )
                        .flat()
                        .join(" ")
                );
            } else {
                setUpdateError(
                    "Failed to update task progress."
                );
            }
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="min-h-full bg-gray-50 p-6">

            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">

                <div>
                    <h1 className="text-2xl font-semibold text-ettm-blue">
                        My Tasks
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        View and manage your assigned tasks.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={fetchMyTasks}
                    disabled={loading}
                    className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading
                        ? "Refreshing..."
                        : "Refresh"}
                </button>

            </div>

            {/* ERROR */}
            {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* LOADING */}
            {loading ? (
                <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">

                    <p className="text-sm text-gray-500">
                        Loading your tasks...
                    </p>

                </div>
            ) : tasks.length === 0 ? (

                /* NO TASKS */
                <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">

                    <p className="text-lg font-semibold text-gray-700">
                        No tasks assigned
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                        You currently don't have any assigned tasks.
                    </p>

                </div>

            ) : (

                /* TASK LIST */
                <div className="space-y-5">

                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        >

                            {/* TASK HEADER */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                                <div>

                                    <p className="text-xs text-gray-400">
                                        Task #{task.id}
                                    </p>

                                    <h2 className="mt-1 text-lg font-semibold text-gray-800">
                                        {task.title}
                                    </h2>

                                </div>

                                <div className="flex flex-wrap gap-2">

                                    {/* STATUS */}
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                                            task.status
                                        )}`}
                                    >
                                        {task.status ||
                                            "Unknown"}
                                    </span>

                                    {/* PRIORITY */}
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${priorityClass(
                                            task.priority
                                        )}`}
                                    >
                                        {task.priority ||
                                            "No Priority"}
                                    </span>

                                </div>

                            </div>

                            {/* DESCRIPTION */}
                            <div className="mt-5">

                                <p className="text-xs font-medium text-gray-400">
                                    Description
                                </p>

                                <p className="mt-1 text-sm leading-6 text-gray-700">
                                    {task.description ||
                                        "-"}
                                </p>

                            </div>

                            {/* TASK INFORMATION */}
                            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

                                {/* ASSIGNED TO */}
                                <div>

                                    <p className="text-xs text-gray-400">
                                        Assigned To
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {
                                            task.assigned_to_name
                                        }
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                        {
                                            task.assigned_to_emp_id
                                        }
                                    </p>

                                </div>

                                {/* START DATE */}
                                <div>

                                    <p className="text-xs text-gray-400">
                                        Start Date
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {formatDate(
                                            task.start_date
                                        )}
                                    </p>

                                </div>

                                {/* DEADLINE */}
                                <div>

                                    <p className="text-xs text-gray-400">
                                        Deadline
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {formatDate(
                                            task.deadline
                                        )}
                                    </p>

                                </div>

                                {/* CREATED BY */}
                                <div>

                                    <p className="text-xs text-gray-400">
                                        Created By
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {
                                            task.created_by_name
                                        }
                                    </p>

                                </div>

                            </div>

                            {/* ACTION */}
                            <div className="mt-6 flex justify-end border-t border-gray-100 pt-5">

                                <button
                                    type="button"
                                    onClick={() =>
                                        openProgressModal(
                                            task
                                        )
                                    }
                                    className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
                                >
                                    Update Progress
                                </button>

                            </div>

                        </div>
                    ))}

                </div>
            )}

            {/* ==========================================
                UPDATE PROGRESS MODAL
            ========================================== */}
            {selectedTask && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={
                        closeProgressModal
                    }
                >

                    <div
                        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">

                            <div>

                                <h2 className="text-lg font-semibold text-gray-800">
                                    Update Task Progress
                                </h2>

                                <p className="mt-1 text-xs text-gray-500">
                                    Task #
                                    {selectedTask.id}
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeProgressModal
                                }
                                disabled={
                                    updating
                                }
                                className="text-2xl text-gray-400 hover:text-gray-700 disabled:opacity-50"
                            >
                                ×
                            </button>

                        </div>

                        {/* FORM */}
                        <form
                            onSubmit={
                                handleTaskUpdate
                            }
                            className="p-6"
                        >

                            {/* TASK INFO */}
                            <div className="mb-5 rounded-lg bg-gray-50 p-4">

                                <p className="text-xs text-gray-400">
                                    Task
                                </p>

                                <p className="mt-1 text-sm font-semibold text-gray-800">
                                    {
                                        selectedTask.title
                                    }
                                </p>

                                <p className="mt-1 text-xs leading-5 text-gray-500">
                                    {
                                        selectedTask.description ||
                                        "-"
                                    }
                                </p>

                            </div>

                            {/* UPDATE TEXT */}
                            <div className="mb-5">

                                <label
                                    htmlFor="update_text"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Progress Update
                                    <span className="text-red-500">
                                        {" "}*
                                    </span>
                                </label>

                                <textarea
                                    id="update_text"
                                    rows={4}
                                    value={
                                        updateText
                                    }
                                    onChange={(e) => {
                                        setUpdateText(
                                            e.target.value
                                        );

                                        setUpdateError(
                                            ""
                                        );

                                        setUpdateSuccess(
                                            ""
                                        );
                                    }}
                                    placeholder="Example: Completed 50% of the UI layout work."
                                    className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
                                />

                            </div>

                            {/* PROGRESS PERCENT */}
                            <div className="mb-5">

                                <label
                                    htmlFor="progress_percent"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Progress Percentage
                                    <span className="text-red-500">
                                        {" "}*
                                    </span>
                                </label>

                                <input
                                    id="progress_percent"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={
                                        progressPercent
                                    }
                                    onChange={(e) => {
                                        setProgressPercent(
                                            e.target.value
                                        );

                                        setUpdateError(
                                            ""
                                        );

                                        setUpdateSuccess(
                                            ""
                                        );
                                    }}
                                    placeholder="Enter progress from 0 to 100"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
                                />

                                {/* PROGRESS BAR */}
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">

                                    <div
                                        className="h-full bg-ettm-blue transition-all"
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                Math.max(
                                                    0,
                                                    Number(
                                                        progressPercent
                                                    ) ||
                                                    0
                                                )
                                            )}%`,
                                        }}
                                    />

                                </div>

                                <p className="mt-2 text-right text-xs font-medium text-gray-500">
                                    {progressPercent ||
                                        0}
                                    %
                                </p>

                            </div>

                            {/* UPDATE SUCCESS */}
                            {updateSuccess && (
                                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                                    {updateSuccess}
                                </div>
                            )}

                            {/* UPDATE ERROR */}
                            {updateError && (
                                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {updateError}
                                </div>
                            )}

                            {/* ACTIONS */}
                            <div className="flex justify-end gap-3">

                                <button
                                    type="button"
                                    onClick={
                                        closeProgressModal
                                    }
                                    disabled={
                                        updating
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        updating
                                    }
                                    className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {updating
                                        ? "Updating..."
                                        : "Submit Progress"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
};

export default MyTasks;