import React, { useEffect, useRef, useState } from "react";
import { punchAttendance } from "../../api/employeeApi";

const Attendance = () => {
    const [attendance, setAttendance] = useState({
        status: "Not Started",
        punchInTime: null,
        punchOutTime: null,
        totalSeconds: 0,
    });

    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const timerRef = useRef(null);

    const formatDuration = (seconds) => {
        const totalSeconds = Number(seconds || 0);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const remainingSeconds = totalSeconds % 60;

        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(remainingSeconds).padStart(2, "0"),
        ].join(":");
    };

    const formatTime = (dateTime) => {
        if (!dateTime) {
            return "--:--";
        }

        const date = new Date(dateTime);

        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        });
    };

    useEffect(() => {
        if (
            attendance.status === "Currently Working" &&
            attendance.punchInTime
        ) {
            const updateTimer = () => {
                const punchInTime = new Date(
                    attendance.punchInTime
                ).getTime();

                const currentTime = Date.now();

                const seconds = Math.max(
                    0,
                    Math.floor(
                        (currentTime - punchInTime) / 1000
                    )
                );

                setElapsedSeconds(seconds);
            };

            updateTimer();

            timerRef.current = setInterval(
                updateTimer,
                1000
            );
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            if (attendance.status === "Completed") {
                setElapsedSeconds(
                    Number(attendance.totalSeconds || 0)
                );
            } else {
                setElapsedSeconds(0);
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [
        attendance.status,
        attendance.punchInTime,
        attendance.totalSeconds,
    ]);

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
            return "Unable to connect to the server. Please check your connection.";
        }

        return "Unable to process attendance. Please try again.";
    };

    const handlePunch = async () => {
        if (attendance.status === "Completed") {
            setErrorMessage(
                "Today's attendance has already been completed."
            );

            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");
            setSuccessMessage("");

            const data = await punchAttendance();

            console.log("Attendance response:", data);

            // Punch in response
            if (data?.status === "Currently Working") {
                setAttendance({
                    status: "Currently Working",
                    punchInTime: data.punch_in_time,
                    punchOutTime: null,
                    totalSeconds: 0,
                });

                setElapsedSeconds(0);

                setSuccessMessage(
                    data.message ||
                        "Punched in successfully."
                );

                return;
            }

            // Punch out response
            if (
                data?.punch_out_time &&
                data?.total_seconds !== undefined
            ) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                const completedAttendance = {
                    status: "Completed",

                    punchInTime:
                        data.punch_in_time ||
                        attendance.punchInTime,

                    punchOutTime: data.punch_out_time,

                    totalSeconds: Number(
                        data.total_seconds || 0
                    ),
                };

                setAttendance(completedAttendance);

                setElapsedSeconds(
                    completedAttendance.totalSeconds
                );

                setSuccessMessage(
                    data.message ||
                        "Punched out successfully."
                );

                return;
            }

            setErrorMessage(
                data?.message ||
                    "Unexpected response from attendance API."
            );
        } catch (error) {
            console.error(
                "Attendance API error:",
                error
            );

            setErrorMessage(
                getErrorMessage(error)
            );
        } finally {
            setLoading(false);
        }
    };

    const workingSeconds =
        attendance.status === "Currently Working"
            ? elapsedSeconds
            : attendance.totalSeconds;

    const getStatusStyle = () => {
        if (attendance.status === "Currently Working") {
            return "border-green-200 bg-green-50 text-green-700";
        }

        if (attendance.status === "Completed") {
            return "border-blue-200 bg-blue-50 text-blue-700";
        }

        return "border-gray-200 bg-gray-50 text-gray-600";
    };

    return (
        <div className="min-h-full bg-gray-50 p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-ettm-blue">
                    Attendance
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Manage your daily attendance and working hours.
                </p>
            </div>

            {successMessage && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errorMessage}
                </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                            Today&apos;s Attendance
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {new Date().toLocaleDateString(
                                "en-IN",
                                {
                                    weekday: "long",
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                }
                            )}
                        </p>
                    </div>

                    <div
                        className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-medium ${getStatusStyle()}`}
                    >
                        <span className="mr-2 h-2 w-2 rounded-full bg-current" />

                        {attendance.status}
                    </div>
                </div>

                {attendance.status ===
                    "Currently Working" && (
                    <div className="py-8 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Working Duration
                        </p>

                        <p className="mt-3 font-mono text-5xl font-semibold tracking-wider text-ettm-blue">
                            {formatDuration(
                                elapsedSeconds
                            )}
                        </p>

                        <p className="mt-3 text-sm text-green-600">
                            You are currently working
                        </p>
                    </div>
                )}

                {attendance.status === "Completed" && (
                    <div className="py-8 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Total Working Time
                        </p>

                        <p className="mt-3 font-mono text-5xl font-semibold tracking-wider text-ettm-blue">
                            {formatDuration(
                                attendance.totalSeconds
                            )}
                        </p>

                        <p className="mt-3 text-sm font-medium text-blue-600">
                            Today&apos;s attendance is completed
                        </p>

                        <p className="mt-2 text-xs text-gray-400">
                            You cannot punch in again today.
                        </p>
                    </div>
                )}

                {attendance.status === "Not Started" && (
                    <div className="py-8 text-center">
                        <p className="text-sm text-gray-500">
                            You have not punched in today.
                        </p>

                        <p className="mt-2 text-xs text-gray-400">
                            Click the button below to start your attendance.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-xs font-medium text-gray-400">
                            Punch In
                        </p>

                        <p className="mt-2 text-lg font-semibold text-gray-800">
                            {formatTime(
                                attendance.punchInTime
                            )}
                        </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-xs font-medium text-gray-400">
                            Punch Out
                        </p>

                        <p className="mt-2 text-lg font-semibold text-gray-800">
                            {formatTime(
                                attendance.punchOutTime
                            )}
                        </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-xs font-medium text-gray-400">
                            Working Hours
                        </p>

                        <p className="mt-2 text-lg font-semibold text-gray-800">
                            {formatDuration(
                                workingSeconds
                            )}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex justify-center">
                    {attendance.status !== "Completed" && (
                        <button
                            type="button"
                            onClick={handlePunch}
                            disabled={loading}
                            className={`rounded-lg px-10 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                attendance.status ===
                                "Currently Working"
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-ettm-blue hover:opacity-90"
                            }`}
                        >
                            {loading
                                ? "Processing..."
                                : attendance.status ===
                                    "Currently Working"
                                  ? "Punch Out"
                                  : "Punch In"}
                        </button>
                    )}

                    {attendance.status === "Completed" && (
                        <div className="rounded-lg bg-blue-50 px-8 py-3 text-sm font-semibold text-blue-700">
                            ✓ Attendance Completed
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Attendance;