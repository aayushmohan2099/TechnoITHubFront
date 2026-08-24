import React, { useEffect, useMemo, useState } from "react";
import { getAttendanceHistory } from "../../api/employeeApi";

const Attendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAttendanceHistory();

            console.log("Attendance API Response:", data);

            if (Array.isArray(data)) {
                setAttendance(data);
            } else if (Array.isArray(data?.results)) {
                setAttendance(data.results);
            } else {
                setAttendance([]);
            }
        } catch (err) {
            console.error("Attendance Error:", err);

            setError(
                err?.response?.data?.detail ||
                "Failed to load attendance history."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    // Convert seconds to readable hours/minutes
    const formatDuration = (seconds) => {
        if (
            seconds === null ||
            seconds === undefined ||
            seconds === ""
        ) {
            return "-";
        }

        const totalSeconds = Number(seconds);

        if (Number.isNaN(totalSeconds)) {
            return "-";
        }

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );

        return `${hours}h ${String(minutes).padStart(2, "0")}m`;
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(`${date}T00:00:00`).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    // Format punch time
    const formatTime = (dateTime) => {
        if (!dateTime) return "Not Punched";

        const date = new Date(dateTime);

        if (Number.isNaN(date.getTime())) {
            return dateTime;
        }

        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    // Get today's date
    const today = new Date();

    const todayString =
        `${today.getFullYear()}-${String(
            today.getMonth() + 1
        ).padStart(2, "0")}-${String(
            today.getDate()
        ).padStart(2, "0")}`;

    // Today's attendance
    const todaysAttendance = useMemo(() => {
        return attendance.filter(
            (item) =>
                item.attendance_date === todayString
        );
    }, [attendance, todayString]);

    // Search today's attendance
    const filteredAttendance = todaysAttendance.filter(
        (item) => {
            const searchText = search.toLowerCase();

            return (
                item.employee_id
                    ?.toLowerCase()
                    .includes(searchText) ||
                item.employee_name
                    ?.toLowerCase()
                    .includes(searchText) ||
                item.name
                    ?.toLowerCase()
                    .includes(searchText)
            );
        }
    );

    // Get employee records
    const employeeRecords = selectedEmployee
        ? attendance.filter(
            (item) =>
                item.employee_id ===
                selectedEmployee.employee_id ||
                item.employee_id ===
                selectedEmployee.id
        )
        : [];

    // Calendar helpers
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay();

    const daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    const previousMonth = () => {
        setCurrentMonth(
            new Date(year, month - 1, 1)
        );
        setSelectedDate(null);
    };

    const nextMonth = () => {
        setCurrentMonth(
            new Date(year, month + 1, 1)
        );
        setSelectedDate(null);
    };

    const monthName = currentMonth.toLocaleDateString(
        "en-IN",
        {
            month: "long",
            year: "numeric",
        }
    );

    const getDateString = (day) => {
        return `${year}-${String(month + 1).padStart(
            2,
            "0"
        )}-${String(day).padStart(2, "0")}`;
    };

    const getAttendanceForDate = (date) => {
        return employeeRecords.find(
            (item) =>
                item.attendance_date === date
        );
    };

    const selectedDateAttendance =
        selectedDate
            ? getAttendanceForDate(selectedDate)
            : null;

    return (
        <div className="min-h-full bg-gray-50 p-6">

            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">

                <div>
                    <h1 className="text-2xl font-semibold text-ettm-blue">
                        Attendance History
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Monitor employee attendance and working hours.
                    </p>
                </div>

                <button
                    onClick={fetchAttendance}
                    disabled={loading}
                    className="rounded-lg bg-ettm-blue px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
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

            {/* TODAY */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">

                <div className="border-b border-gray-200 px-5 py-4">

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Today's Attendance
                            </h2>

                            <p className="mt-1 text-xs text-gray-500">
                                {formatDate(todayString)}
                            </p>
                        </div>

                        <div className="w-full md:w-80">

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search employee..."
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
                            />

                        </div>

                    </div>

                </div>

                {loading ? (
                    <div className="py-14 text-center text-sm text-gray-500">
                        Loading attendance...
                    </div>
                ) : filteredAttendance.length === 0 ? (
                    <div className="py-14 text-center text-sm text-gray-500">
                        No attendance records found for today.
                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[900px]">

                            <thead className="bg-gray-50">

                                <tr>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Employee
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Date
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Punch In
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Punch Out
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                                        Working Duration
                                    </th>

                                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase text-gray-500">
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100">

                                {filteredAttendance.map(
                                    (item, index) => (
                                        <tr
                                            key={
                                                item.id ||
                                                `${item.employee_id}-${index}`
                                            }
                                            className="hover:bg-gray-50"
                                        >

                                            <td className="px-5 py-4">

                                                <p className="text-sm font-semibold text-gray-800">
                                                    {
                                                        item.employee_name ||
                                                        item.name ||
                                                        "-"
                                                    }
                                                </p>

                                                <p className="mt-1 text-xs text-gray-500">
                                                    {
                                                        item.employee_id ||
                                                        "-"
                                                    }
                                                </p>

                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {formatDate(
                                                    item.attendance_date
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {formatTime(
                                                    item.punch_in
                                                )}
                                            </td>

                                            <td className="px-5 py-4">

                                                {item.punch_out ? (
                                                    <span className="text-sm text-gray-600">
                                                        {formatTime(
                                                            item.punch_out
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                                                        Not Punched Out
                                                    </span>
                                                )}

                                            </td>

                                            <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                {formatDuration(
                                                    item.total_seconds
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-center">

                                                <button
                                                    onClick={() => {
                                                        setSelectedEmployee(
                                                            item
                                                        );

                                                        setSelectedDate(
                                                            item.attendance_date
                                                        );

                                                        setCurrentMonth(
                                                            new Date(
                                                                `${item.attendance_date}T00:00:00`
                                                            )
                                                        );
                                                    }}
                                                    className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                                >
                                                    View
                                                </button>

                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {/* EMPLOYEE CALENDAR */}
            {selectedEmployee && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

                    {/* Calendar Header */}
                    <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">

                        <div>

                            <h2 className="text-lg font-semibold text-gray-800">
                                Employee Attendance
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                {selectedEmployee.employee_name ||
                                    selectedEmployee.name ||
                                    "-"}
                                {" "}
                                (
                                {selectedEmployee.employee_id ||
                                    "-"}
                                )
                            </p>

                        </div>

                        <button
                            onClick={() =>
                                setSelectedEmployee(null)
                            }
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Close
                        </button>

                    </div>

                    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">

                        {/* CALENDAR */}
                        <div className="lg:col-span-2">

                            <div className="mb-4 flex items-center justify-between">

                                <button
                                    onClick={previousMonth}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                    ←
                                </button>

                                <h3 className="text-lg font-semibold text-gray-800">
                                    {monthName}
                                </h3>

                                <button
                                    onClick={nextMonth}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                    →
                                </button>

                            </div>

                            <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-gray-200">

                                {[
                                    "Sun",
                                    "Mon",
                                    "Tue",
                                    "Wed",
                                    "Thu",
                                    "Fri",
                                    "Sat",
                                ].map(
                                    (day) => (
                                        <div
                                            key={day}
                                            className="border-b border-r bg-gray-50 px-2 py-3 text-center text-xs font-semibold text-gray-500"
                                        >
                                            {day}
                                        </div>
                                    )
                                )}

                                {Array.from({
                                    length: firstDay,
                                }).map(
                                    (_, index) => (
                                        <div
                                            key={`empty-${index}`}
                                            className="min-h-[80px] border-b border-r bg-gray-50"
                                        />
                                    )
                                )}

                                {Array.from({
                                    length: daysInMonth,
                                }).map(
                                    (_, index) => {
                                        const day =
                                            index + 1;

                                        const date =
                                            getDateString(
                                                day
                                            );

                                        const record =
                                            getAttendanceForDate(
                                                date
                                            );

                                        const isSelected =
                                            selectedDate ===
                                            date;

                                        return (
                                            <button
                                                type="button"
                                                key={date}
                                                onClick={() => {
                                                    setSelectedDate(
                                                        date
                                                    );
                                                }}
                                                className={`min-h-[80px] border-b border-r p-2 text-left transition ${isSelected
                                                    ? "bg-blue-50"
                                                    : "bg-white hover:bg-gray-50"
                                                    }`}
                                            >

                                                <div className="flex items-start justify-between">

                                                    <span className="text-sm font-medium text-gray-700">
                                                        {day}
                                                    </span>

                                                    {record && (
                                                        <span className="h-2.5 w-2.5 rounded-full bg-ettm-blue" />
                                                    )}

                                                </div>

                                                {record && (
                                                    <div className="mt-3">

                                                        <p className="text-[10px] text-green-600">
                                                            Present
                                                        </p>

                                                        <p className="mt-1 text-[10px] text-gray-500">
                                                            {formatDuration(
                                                                record.total_seconds
                                                            )}
                                                        </p>

                                                    </div>
                                                )}

                                            </button>
                                        );
                                    }
                                )}

                            </div>

                            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                                <span className="h-2.5 w-2.5 rounded-full bg-ettm-blue" />
                                Attendance recorded
                            </div>

                        </div>

                        {/* SELECTED DATE DETAILS */}
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

                            <h3 className="text-base font-semibold text-gray-800">
                                Attendance Details
                            </h3>

                            {selectedDate ? (
                                <>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {formatDate(
                                            selectedDate
                                        )}
                                    </p>

                                    {selectedDateAttendance ? (
                                        <div className="mt-6 space-y-4">

                                            <div className="rounded-lg bg-white p-4">
                                                <p className="text-xs text-gray-400">
                                                    Punch In
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-gray-800">
                                                    {formatTime(
                                                        selectedDateAttendance.punch_in
                                                    )}
                                                </p>
                                            </div>

                                            <div className="rounded-lg bg-white p-4">
                                                <p className="text-xs text-gray-400">
                                                    Punch Out
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-gray-800">
                                                    {selectedDateAttendance.punch_out
                                                        ? formatTime(
                                                            selectedDateAttendance.punch_out
                                                        )
                                                        : "Not Punched Out"}
                                                </p>
                                            </div>

                                            <div className="rounded-lg bg-white p-4">
                                                <p className="text-xs text-gray-400">
                                                    Total Working Hours
                                                </p>

                                                <p className="mt-1 text-lg font-semibold text-ettm-blue">
                                                    {formatDuration(
                                                        selectedDateAttendance.total_seconds
                                                    )}
                                                </p>
                                            </div>

                                            <div className="rounded-lg bg-white p-4">
                                                <p className="text-xs text-gray-400">
                                                    Status
                                                </p>

                                                <p className="mt-1 text-sm font-semibold text-green-600">
                                                    Present
                                                </p>
                                            </div>

                                        </div>
                                    ) : (
                                        <div className="mt-6 rounded-lg bg-white p-5 text-center">

                                            <p className="text-sm font-medium text-gray-700">
                                                No attendance recorded
                                            </p>

                                            <p className="mt-1 text-xs text-gray-500">
                                                No attendance data is available for this date.
                                            </p>

                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="mt-6 text-center text-sm text-gray-500">
                                    Select a date from the calendar.
                                </div>
                            )}

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};

export default Attendance;