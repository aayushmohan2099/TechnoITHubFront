import React, { useEffect, useRef, useState } from "react";
import { punchAttendance } from "../../api/employeeApi";

const ATTENDANCE_STORAGE_KEY = "employee_attendance";

const Attendance = () => {
    // --------------------------------------------------
    // Get today's date key
    // --------------------------------------------------
    const getTodayKey = () => {
        const today = new Date();

        return `${today.getFullYear()}-${String(
            today.getMonth() + 1
        ).padStart(2, "0")}-${String(
            today.getDate()
        ).padStart(2, "0")}`;
    };

    // --------------------------------------------------
    // Initial Attendance State
    // Restore from localStorage if it belongs to today
    // --------------------------------------------------
    const [attendance, setAttendance] = useState(() => {
        const savedAttendance = localStorage.getItem(
            ATTENDANCE_STORAGE_KEY
        );

        if (savedAttendance) {
            try {
                const parsedAttendance =
                    JSON.parse(savedAttendance);

                // Restore only today's attendance
                if (
                    parsedAttendance.date ===
                    getTodayKey()
                ) {
                    return parsedAttendance;
                }

                // Remove old attendance
                localStorage.removeItem(
                    ATTENDANCE_STORAGE_KEY
                );
            } catch (error) {
                console.error(
                    "Invalid attendance data:",
                    error
                );

                localStorage.removeItem(
                    ATTENDANCE_STORAGE_KEY
                );
            }
        }

        return {
            date: getTodayKey(),
            status: "Not Started",
            punchInTime: null,
            punchOutTime: null,
            totalSeconds: 0,
        };
    });

    const [elapsedSeconds, setElapsedSeconds] =
        useState(0);

    const [loading, setLoading] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    const timerRef = useRef(null);

    // --------------------------------------------------
    // Save Attendance to localStorage
    // --------------------------------------------------
    useEffect(() => {
        localStorage.setItem(
            ATTENDANCE_STORAGE_KEY,
            JSON.stringify(attendance)
        );
    }, [attendance]);

    // --------------------------------------------------
    // Format seconds → HH:MM:SS
    // --------------------------------------------------
    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);

        const mins = Math.floor(
            (seconds % 3600) / 60
        );

        const secs = seconds % 60;

        return [
            String(hrs).padStart(2, "0"),
            String(mins).padStart(2, "0"),
            String(secs).padStart(2, "0"),
        ].join(":");
    };

    // --------------------------------------------------
    // Format API timestamp → local time
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Live Working Timer
    // --------------------------------------------------
    useEffect(() => {
        if (
            attendance.status ===
            "Currently Working" &&
            attendance.punchInTime
        ) {
            const updateTimer = () => {
                const punchIn = new Date(
                    attendance.punchInTime
                ).getTime();

                const now = Date.now();

                const seconds = Math.max(
                    0,
                    Math.floor(
                        (now - punchIn) / 1000
                    )
                );

                setElapsedSeconds(seconds);
            };

            // Run immediately
            updateTimer();

            // Update every second
            timerRef.current = setInterval(
                updateTimer,
                1000
            );
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            if (
                attendance.status ===
                "Completed"
            ) {
                setElapsedSeconds(
                    Number(
                        attendance.totalSeconds
                    )
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

    // --------------------------------------------------
    // Punch In / Punch Out
    // --------------------------------------------------
    const handlePunch = async () => {
        try {
            setLoading(true);
            setErrorMessage("");
            setSuccessMessage("");

            const data =
                await punchAttendance();

            console.log(
                "Attendance Response:",
                data
            );

            // ------------------------------------------
            // PUNCH IN
            // ------------------------------------------
            if (
                data.status ===
                "Currently Working"
            ) {
                const newAttendance = {
                    date: getTodayKey(),
                    status: "Currently Working",
                    punchInTime:
                        data.punch_in_time,
                    punchOutTime: null,
                    totalSeconds: 0,
                };

                setAttendance(newAttendance);

                localStorage.setItem(
                    ATTENDANCE_STORAGE_KEY,
                    JSON.stringify(
                        newAttendance
                    )
                );

                setElapsedSeconds(0);

                setSuccessMessage(
                    data.message ||
                    "Punched in successfully"
                );

                return;
            }

            // ------------------------------------------
            // PUNCH OUT
            // ------------------------------------------
            if (
                data.punch_out_time &&
                data.total_seconds !==
                undefined
            ) {
                console.log(
                    "Punched out successfully:",
                    data
                );

                // Stop timer
                if (timerRef.current) {
                    clearInterval(
                        timerRef.current
                    );

                    timerRef.current = null;
                }

                // Clear attendance storage
                localStorage.removeItem(
                    ATTENDANCE_STORAGE_KEY
                );

                // ----------------------------------
                // CLEAR LOGIN TOKENS
                // ----------------------------------

                // Use the keys that your login
                // actually stores.
                localStorage.removeItem(
                    "access"
                );

                localStorage.removeItem(
                    "refresh"
                );

                localStorage.removeItem(
                    "access_token"
                );

                localStorage.removeItem(
                    "refresh_token"
                );

                // ----------------------------------
                // LOGOUT
                // ----------------------------------
                window.location.href =
                    "/login";

                return;
            }

            // ------------------------------------------
            // UNEXPECTED RESPONSE
            // ------------------------------------------
            setErrorMessage(
                "Unexpected response from attendance API."
            );
        } catch (error) {
            console.error(
                "Attendance API Error:",
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
            } else if (
                backendError?.message
            ) {
                setErrorMessage(
                    backendError.message
                );
            } else {
                setErrorMessage(
                    "Unable to process attendance. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------------------------
    // Working Duration
    // --------------------------------------------------
    const workingSeconds =
        attendance.status ===
            "Currently Working"
            ? elapsedSeconds
            : attendance.totalSeconds;

    // --------------------------------------------------
    // Status Styling
    // --------------------------------------------------
    const getStatusStyle = () => {
        if (
            attendance.status ===
            "Currently Working"
        ) {
            return "bg-green-50 text-green-700 border-green-200";
        }

        if (
            attendance.status ===
            "Completed"
        ) {
            return "bg-blue-50 text-blue-700 border-blue-200";
        }

        return "bg-gray-50 text-gray-600 border-gray-200";
    };

    return (
        <div className="min-h-full bg-gray-50 p-6">

            {/* PAGE HEADER */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-ettm-blue">
                    Attendance
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Manage your daily attendance
                    and working hours.
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

            {/* ATTENDANCE CARD */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                {/* HEADER */}
                <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                            Today's Attendance
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

                    {/* STATUS */}
                    <div
                        className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-medium ${getStatusStyle()}`}
                    >
                        <span className="mr-2 h-2 w-2 rounded-full bg-current" />

                        {attendance.status}
                    </div>
                </div>

                {/* CURRENTLY WORKING */}
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

                {/* COMPLETED */}
                {attendance.status ===
                    "Completed" && (
                        <div className="py-8 text-center">

                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Total Working Time
                            </p>

                            <p className="mt-3 font-mono text-5xl font-semibold tracking-wider text-ettm-blue">
                                {formatDuration(
                                    attendance.totalSeconds
                                )}
                            </p>

                            <p className="mt-3 text-sm text-blue-600">
                                Today's attendance is
                                completed
                            </p>
                        </div>
                    )}

                {/* NOT STARTED */}
                {attendance.status ===
                    "Not Started" && (
                        <div className="py-8 text-center">

                            <p className="text-sm text-gray-500">
                                You have not punched in
                                today.
                            </p>

                            <p className="mt-2 text-xs text-gray-400">
                                Click the button below to
                                start your attendance.
                            </p>
                        </div>
                    )}

                {/* TIMES */}
                <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">

                    {/* PUNCH IN */}
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

                    {/* WORKING HOURS */}
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

                {/* ACTION BUTTON */}
                <div className="mt-6 flex justify-center">

                    {attendance.status !==
                        "Completed" && (
                            <button
                                type="button"
                                onClick={handlePunch}
                                disabled={loading}
                                className={`rounded-lg px-10 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${attendance.status ===
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

                    {attendance.status ===
                        "Completed" && (
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