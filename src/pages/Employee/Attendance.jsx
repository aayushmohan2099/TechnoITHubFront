import React, { useEffect, useRef, useState } from "react";
import { punchAttendance, getAttendanceByDate } from "../../api/employeeApi";

const Attendance = () => {
    const getTodayDateString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState(getTodayDateString());
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

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setErrorMessage("");
            const data = await getAttendanceByDate(selectedDate);

            const punchIn = data?.punch_in || data?.punch_in_time;
            const punchOut = data?.punch_out || data?.punch_out_time;
            const totalSec = Number(data?.total_seconds || 0);

            if (punchIn && !punchOut) {
                setAttendance({
                    status: "Currently Working",
                    punchInTime: punchIn,
                    punchOutTime: null,
                    totalSeconds: 0,
                });
                setElapsedSeconds(0);
            } else if (punchIn && punchOut) {
                setAttendance({
                    status: "Completed",
                    punchInTime: punchIn,
                    punchOutTime: punchOut,
                    totalSeconds: totalSec,
                });
                setElapsedSeconds(totalSec);
            } else {
                setAttendance({
                    status: "Not Started",
                    punchInTime: null,
                    punchOutTime: null,
                    totalSeconds: 0,
                });
                setElapsedSeconds(0);
            }
        } catch (error) {
            console.error("Failed to fetch attendance:", error);
            setAttendance({
                status: "Not Started",
                punchInTime: null,
                punchOutTime: null,
                totalSeconds: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [selectedDate]);

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
        if (!dateTime) return "--:--";
        const date = new Date(dateTime);
        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        });
    };

    const isToday = selectedDate === getTodayDateString();

    useEffect(() => {
        if (isToday && attendance.status === "Currently Working" && attendance.punchInTime) {
            const updateTimer = () => {
                const punchInTime = new Date(attendance.punchInTime).getTime();
                const currentTime = Date.now();
                const seconds = Math.max(0, Math.floor((currentTime - punchInTime) / 1000));
                setElapsedSeconds(seconds);
            };

            updateTimer();
            timerRef.current = setInterval(updateTimer, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            if (attendance.status === "Completed") {
                setElapsedSeconds(Number(attendance.totalSeconds || 0));
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
    }, [isToday, attendance.status, attendance.punchInTime, attendance.totalSeconds]);

    const getErrorMessage = (error) => {
        const backendError = error?.response?.data;
        if (typeof backendError === "string") return backendError;
        if (backendError?.error) return backendError.error;
        if (backendError?.detail) return Array.isArray(backendError.detail) ? backendError.detail[0] : backendError.detail;
        if (backendError?.message) return Array.isArray(backendError.message) ? backendError.message[0] : backendError.message;
        if (!error?.response) return "Unable to connect to the server. Please check your connection.";
        return "Unable to process attendance. Please try again.";
    };

    const handlePunch = async () => {
        if (!isToday) {
            setErrorMessage("This action is only available for today’s date.");
            return;
        }

        if (attendance.status === "Completed") {
            setErrorMessage("Today’s attendance has already been completed.");
            return;
        }

        try {
            setLoading(true);
            setErrorMessage("");
            setSuccessMessage("");

            const data = await punchAttendance();
            const attendancePayload = data?.data || data;

            if (attendancePayload?.status === "Currently Working" || (attendancePayload?.punch_in_time && !attendancePayload?.punch_out_time)) {
                setAttendance({
                    status: "Currently Working",
                    punchInTime: attendancePayload.punch_in_time || attendancePayload.punch_in,
                    punchOutTime: null,
                    totalSeconds: 0,
                });
                setElapsedSeconds(0);
                setSuccessMessage(attendancePayload.message || data?.message || "Punched in successfully.");
                await fetchAttendance();
                return;
            }

            if (attendancePayload?.punch_out_time || attendancePayload?.punch_out || attendancePayload?.status === "Completed") {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                const outTime = attendancePayload.punch_out_time || attendancePayload.punch_out;
                const totalSec = Number(attendancePayload.total_seconds || 0);

                setAttendance({
                    status: "Completed",
                    punchInTime: attendancePayload.punch_in_time || attendancePayload.punch_in || attendance.punchInTime,
                    punchOutTime: outTime,
                    totalSeconds: totalSec,
                });

                setElapsedSeconds(totalSec);
                setSuccessMessage(attendancePayload.message || data?.message || "Punched out successfully.");
                await fetchAttendance();
                return;
            }

            setErrorMessage(attendancePayload?.message || data?.message || "Unexpected response from attendance API.");
        } catch (error) {
            console.error("Attendance API error:", error);
            setErrorMessage(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const workingSeconds = attendance.status === "Currently Working" ? elapsedSeconds : attendance.totalSeconds;

    const getStatusStyle = () => {
        if (attendance.status === "Currently Working") return "border-green-200 bg-green-50 text-green-700";
        if (attendance.status === "Completed") return "border-blue-200 bg-blue-50 text-blue-700";
        return "border-gray-200 bg-gray-50 text-gray-600";
    };

    return (
        <div className="min-h-full bg-gray-50 p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ettm-blue">Attendance</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your daily attendance and view history.</p>
                </div>

                {/* Date Filter Input */}
                <div className="flex items-center gap-2">
                    <label htmlFor="attendance-date" className="text-sm font-medium text-gray-700">
                        Select Date:
                    </label>
                    <input
                        id="attendance-date"
                        type="date"
                        value={selectedDate}
                        max={getTodayDateString()}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-ettm-blue focus:outline-none"
                    />
                </div>
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
                            Attendance for {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                        </h2>
                    </div>

                    <div className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-medium ${getStatusStyle()}`}>
                        <span className="mr-2 h-2 w-2 rounded-full bg-current" />
                        {attendance.status}
                    </div>
                </div>

                {attendance.status === "Currently Working" && (
                    <div className="py-8 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Working Duration</p>
                        <p className="mt-3 font-mono text-5xl font-semibold tracking-wider text-ettm-blue">
                            {formatDuration(elapsedSeconds)}
                        </p>
                        <p className="mt-3 text-sm text-green-600">You are currently working</p>
                    </div>
                )}

                {attendance.status === "Completed" && (
                    <div className="py-8 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Working Time</p>
                        <p className="mt-3 font-mono text-5xl font-semibold tracking-wider text-ettm-blue">
                            {formatDuration(attendance.totalSeconds)}
                        </p>
                        <p className="mt-3 text-sm font-medium text-blue-600">Attendance is completed for this date</p>
                    </div>
                )}

                {attendance.status === "Not Started" && (
                    <div className="py-8 text-center">
                        <p className="text-sm text-gray-500">No attendance record found for this date.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-xs font-medium text-gray-400">Punch In</p>
                        <p className="mt-2 text-lg font-semibold text-gray-800">{formatTime(attendance.punchInTime)}</p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-xs font-medium text-gray-400">Punch Out</p>
                        <p className="mt-2 text-lg font-semibold text-gray-800">{formatTime(attendance.punchOutTime)}</p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                        <p className="text-xs font-medium text-gray-400">Working Hours</p>
                        <p className="mt-2 text-lg font-semibold text-gray-800">{formatDuration(workingSeconds)}</p>
                    </div>
                </div>

                {/* Punch Button (Visible only for today's date if not completed) */}
                {isToday && (
                    <div className="mt-6 flex justify-center">
                        {attendance.status !== "Completed" ? (
                            <button
                                type="button"
                                onClick={handlePunch}
                                disabled={loading}
                                className={`rounded-lg px-10 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    attendance.status === "Currently Working"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-ettm-blue hover:opacity-90"
                                }`}
                            >
                                {loading
                                    ? "Processing..."
                                    : attendance.status === "Currently Working"
                                    ? "Punch Out"
                                    : "Punch In"}
                            </button>
                        ) : (
                            <div className="rounded-lg bg-blue-50 px-8 py-3 text-sm font-semibold text-blue-700">
                                ✓ Attendance Completed
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Attendance;