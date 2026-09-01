import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    getMyTasks,
    updateTaskProgress,
} from "../../api/employeeApi";

const MyTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Backend pagination
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] =
        useState(null);

    // Selected task
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

    // Prevent duplicate progress-update requests
    const updatingRef = useRef(false);

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

    const fetchMyTasks = useCallback(
        async (pageNumber = 1) => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await getMyTasks(pageNumber);

                console.log(
                    "My Tasks Response:",
                    response
                );

                const taskResults =
                    extractTasks(response);

                setTasks(taskResults);

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
                console.error(
                    "My Tasks Error:",
                    error
                );

                setTasks([]);
                setTotalCount(0);
                setNextPage(null);
                setPreviousPage(null);

                setError(
                    error?.response?.data?.detail ||
                        error?.response?.data
                            ?.message ||
                        "Failed to load your tasks."
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Load whenever the page changes
    useEffect(() => {
        fetchMyTasks(page);
    }, [page, fetchMyTasks]);

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    const priorityClass = (value) => {
        switch (
            String(value || "").toLowerCase()
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

    const statusClass = (value) => {
        switch (
            String(value || "").toLowerCase()
        ) {
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
                return "bg-gray-100 text-gray-600";
        }
    };

    const openProgressModal = (task) => {
        setSelectedTask(task);
        setUpdateText("");
        setProgressPercent("");
        setUpdateError("");
        setUpdateSuccess("");
    };

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

    const handleTaskUpdate = async (event) => {
        event.preventDefault();

        // Prevent duplicate API requests
        if (updatingRef.current) {
            return;
        }

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
            updatingRef.current = true;
            setUpdating(true);

            const payload = {
                update_text: updateText.trim(),
                progress_percent: progress,
            };

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

            // Reload the current page
            await fetchMyTasks(page);
        } catch (error) {
            console.error(
                "Task Progress Update Error:",
                error
            );

            const backendError =
                error?.response?.data;

            if (
                typeof backendError === "string"
            ) {
                setUpdateError(backendError);
            } else if (
                backendError?.detail
            ) {
                setUpdateError(
                    Array.isArray(
                        backendError.detail
                    )
                        ? backendError.detail[0]
                        : backendError.detail
                );
            } else if (
                backendError?.message
            ) {
                setUpdateError(
                    Array.isArray(
                        backendError.message
                    )
                        ? backendError.message[0]
                        : backendError.message
                );
            } else if (backendError) {
                setUpdateError(
                    Object.values(backendError)
                        .flat()
                        .join(" ")
                );
            } else {
                setUpdateError(
                    "Failed to update task progress."
                );
            }
        } finally {
            updatingRef.current = false;
            setUpdating(false);
        }
    };

    const progressBarWidth = Math.min(
        100,
        Math.max(
            0,
            Number(progressPercent) || 0
        )
    );

    return (
        <div className="min-h-full bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ettm-blue">
                        My Tasks
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        View and manage your assigned
                        tasks.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        fetchMyTasks(page)
                    }
                    disabled={loading}
                    className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading
                        ? "Refreshing..."
                        : "Refresh"}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-ettm-blue" />

                    <p className="mt-3 text-sm text-gray-500">
                        Loading your tasks...
                    </p>
                </div>
            ) : tasks.length === 0 ? (
                /* No tasks */
                <div className="rounded-xl border border-gray-200 bg-white py-16 text-center shadow-sm">
                    <p className="text-lg font-semibold text-gray-700">
                        No tasks assigned
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                        You currently don't have any
                        assigned tasks.
                    </p>
                </div>
            ) : (
                /* Task list */
                <div className="space-y-5">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            {/* Task heading */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-xs text-gray-400">
                                        Task #{task.id}
                                    </p>

                                    <h2 className="mt-1 text-lg font-semibold text-gray-800">
                                        {task.title ||
                                            "Untitled Task"}
                                    </h2>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                                            task.status
                                        )}`}
                                    >
                                        {task.status ||
                                            "Unknown"}
                                    </span>

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

                            {/* Description */}
                            <div className="mt-5">
                                <p className="text-xs font-medium text-gray-400">
                                    Description
                                </p>

                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                    {task.description ||
                                        "-"}
                                </p>
                            </div>

                            {/* Task information */}
                            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <p className="text-xs text-gray-400">
                                        Assigned To
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {task.assigned_to_name ||
                                            "-"}
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                        {task.assigned_to_emp_id ||
                                            "-"}
                                    </p>
                                </div>

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

                                <div>
                                    <p className="text-xs text-gray-400">
                                        Created By
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-gray-800">
                                        {task.created_by_name ||
                                            "-"}
                                    </p>
                                </div>
                            </div>

                            {/* Progress history */}
                            {Array.isArray(
                                task.daily_updates
                            ) &&
                                task.daily_updates
                                    .length > 0 && (
                                    <div className="mt-6 border-t border-gray-100 pt-5">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                            Latest Progress
                                        </p>

                                        {(() => {
                                            const latestUpdate =
                                                task
                                                    .daily_updates[
                                                    task
                                                        .daily_updates
                                                        .length -
                                                        1
                                                ];

                                            const latestProgress =
                                                Math.min(
                                                    100,
                                                    Math.max(
                                                        0,
                                                        Number(
                                                            latestUpdate?.progress_percent ||
                                                                0
                                                        )
                                                    )
                                                );

                                            return (
                                                <div className="mt-3 rounded-lg bg-gray-50 p-4">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm text-gray-700">
                                                            {latestUpdate?.update_text ||
                                                                "No update text"}
                                                        </p>

                                                        <span className="text-sm font-semibold text-ettm-blue">
                                                            {
                                                                latestProgress
                                                            }
                                                            %
                                                        </span>
                                                    </div>

                                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                                                        <div
                                                            className="h-full rounded-full bg-ettm-blue"
                                                            style={{
                                                                width: `${latestProgress}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                            {/* Action */}
                            <div className="mt-6 flex justify-end border-t border-gray-100 pt-5">
                                <button
                                    type="button"
                                    onClick={() =>
                                        openProgressModal(
                                            task
                                        )
                                    }
                                    disabled={
                                        String(
                                            task.status ||
                                                ""
                                        ).toLowerCase() ===
                                        "completed"
                                    }
                                    className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {String(
                                        task.status || ""
                                    ).toLowerCase() ===
                                    "completed"
                                        ? "Task Completed"
                                        : "Update Progress"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalCount > 0 && (
                <div className="mt-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-600">
                            Page{" "}
                            <span className="font-semibold text-gray-800">
                                {page}
                            </span>
                            {" • "}
                            {totalCount} total tasks
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                            Showing up to 10 tasks per
                            page
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
                                setPage(
                                    (
                                        currentPage
                                    ) =>
                                        Math.max(
                                            1,
                                            currentPage -
                                                1
                                        )
                                )
                            }
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <div className="flex min-w-10 items-center justify-center rounded-lg bg-ettm-blue px-4 py-2 text-sm font-semibold text-white">
                            {page}
                        </div>

                        <button
                            type="button"
                            disabled={
                                !nextPage || loading
                            }
                            onClick={() =>
                                setPage(
                                    (
                                        currentPage
                                    ) =>
                                        currentPage + 1
                                )
                            }
                            className="rounded-lg bg-ettm-blue px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Update progress modal */}
            {selectedTask && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={closeProgressModal}
                >
                    <div
                        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        {/* Modal heading */}
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
                                disabled={updating}
                                className="text-2xl text-gray-400 hover:text-gray-700 disabled:opacity-50"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleTaskUpdate
                            }
                            className="p-6"
                        >
                            {/* Task information */}
                            <div className="mb-5 rounded-lg bg-gray-50 p-4">
                                <p className="text-xs text-gray-400">
                                    Task
                                </p>

                                <p className="mt-1 text-sm font-semibold text-gray-800">
                                    {selectedTask.title}
                                </p>

                                <p className="mt-1 text-xs leading-5 text-gray-500">
                                    {selectedTask.description ||
                                        "-"}
                                </p>
                            </div>

                            {/* Update text */}
                            <div className="mb-5">
                                <label
                                    htmlFor="update_text"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Progress Update{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <textarea
                                    id="update_text"
                                    rows={4}
                                    value={updateText}
                                    onChange={(
                                        event
                                    ) => {
                                        setUpdateText(
                                            event.target
                                                .value
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

                            {/* Progress percentage */}
                            <div className="mb-5">
                                <label
                                    htmlFor="progress_percent"
                                    className="mb-2 block text-sm font-medium text-gray-700"
                                >
                                    Progress Percentage{" "}
                                    <span className="text-red-500">
                                        *
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
                                    onChange={(
                                        event
                                    ) => {
                                        setProgressPercent(
                                            event.target
                                                .value
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

                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                                    <div
                                        className="h-full bg-ettm-blue transition-all"
                                        style={{
                                            width: `${progressBarWidth}%`,
                                        }}
                                    />
                                </div>

                                <p className="mt-2 text-right text-xs font-medium text-gray-500">
                                    {progressBarWidth}%
                                </p>
                            </div>

                            {updateSuccess && (
                                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                                    {updateSuccess}
                                </div>
                            )}

                            {updateError && (
                                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {updateError}
                                </div>
                            )}

                            {/* Modal actions */}
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={
                                        closeProgressModal
                                    }
                                    disabled={updating}
                                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={updating}
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