import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    getAttendanceHistory,
} from "../../api/employeeApi";

const Attendance = () => {
    const [attendance, setAttendance] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [selectedEmployee, setSelectedEmployee] =
        useState(null);

    const [selectedDate, setSelectedDate] =
        useState(null);

    const [currentMonth, setCurrentMonth] =
        useState(new Date());

    // --------------------------------------------------
    // Calendar Section Ref
    // --------------------------------------------------
    const calendarRef = useRef(null);

    // --------------------------------------------------
    // Pagination
    // --------------------------------------------------
    const [page, setPage] =
        useState(1);

    const [totalCount, setTotalCount] =
        useState(0);

    const [nextPage, setNextPage] =
        useState(null);

    const [previousPage, setPreviousPage] =
        useState(null);

    // --------------------------------------------------
    // Today's Date
    // --------------------------------------------------
    const getTodayString = () => {
        const today = new Date();

        return `${today.getFullYear()}-${String(
            today.getMonth() + 1
        ).padStart(2, "0")}-${String(
            today.getDate()
        ).padStart(2, "0")}`;
    };

    // --------------------------------------------------
    // Main Date Filter
    // Default = Today
    // --------------------------------------------------
    const [filterDate, setFilterDate] =
        useState(getTodayString());

    // --------------------------------------------------
    // Fetch Attendance
    // --------------------------------------------------
    const fetchAttendance = async (
        pageNumber = page,
        dateValue = filterDate
    ) => {
        try {
            setLoading(true);
            setError("");

            const data =
                await getAttendanceHistory({
                    page: pageNumber,
                    date: dateValue,
                });

            console.log(
                "Attendance API Response:",
                data
            );

            // ------------------------------------------
            // Paginated Response
            // ------------------------------------------
            if (
                Array.isArray(data?.results)
            ) {
                setAttendance(
                    data.results
                );

                setTotalCount(
                    data.count || 0
                );

                setNextPage(
                    data.next || null
                );

                setPreviousPage(
                    data.previous || null
                );

                return;
            }

            // ------------------------------------------
            // data array response
            // ------------------------------------------
            if (
                Array.isArray(data?.data)
            ) {
                setAttendance(
                    data.data
                );

                setTotalCount(
                    data.count ||
                    data.data.length
                );

                setNextPage(
                    data.next || null
                );

                setPreviousPage(
                    data.previous || null
                );

                return;
            }

            // ------------------------------------------
            // Normal Array Response
            // ------------------------------------------
            if (Array.isArray(data)) {
                setAttendance(data);

                setTotalCount(
                    data.length
                );

                setNextPage(null);
                setPreviousPage(null);

                return;
            }

            setAttendance([]);
            setTotalCount(0);
            setNextPage(null);
            setPreviousPage(null);

        } catch (err) {
            console.error(
                "Attendance Error:",
                err
            );

            setAttendance([]);

            setError(
                err?.response?.data?.detail ||
                "Failed to load attendance history."
            );
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------------------------
    // Initial + Date Change
    // --------------------------------------------------
    useEffect(() => {
        setPage(1);

        fetchAttendance(
            1,
            filterDate
        );
    }, [filterDate]);

    // --------------------------------------------------
    // Page Change
    // --------------------------------------------------
    useEffect(() => {
        fetchAttendance(
            page,
            filterDate
        );
    }, [page]);

    // --------------------------------------------------
    // Format Duration
    // --------------------------------------------------
    const formatDuration = (seconds) => {
        if (
            seconds === null ||
            seconds === undefined ||
            seconds === ""
        ) {
            return "-";
        }

        const totalSeconds =
            Number(seconds);

        if (
            Number.isNaN(totalSeconds)
        ) {
            return "-";
        }

        const hours =
            Math.floor(
                totalSeconds / 3600
            );

        const minutes =
            Math.floor(
                (totalSeconds % 3600) /
                60
            );

        return `${hours}h ${String(
            minutes
        ).padStart(2, "0")}m`;
    };

    // --------------------------------------------------
    // Format Date
    // --------------------------------------------------
    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(
            `${date}T00:00:00`
        ).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    // --------------------------------------------------
    // Format Time
    // --------------------------------------------------
    const formatTime = (dateTime) => {
        if (!dateTime) {
            return "Not Punched";
        }

        const date =
            new Date(dateTime);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return dateTime;
        }

        return date.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            }
        );
    };

    // --------------------------------------------------
    // Search Within Current Date Page
    // --------------------------------------------------
    const filteredAttendance =
        useMemo(() => {
            const searchText =
                search
                    .toLowerCase()
                    .trim();

            if (!searchText) {
                return attendance;
            }

            return attendance.filter(
                (item) =>
                    item.employee_id
                        ?.toLowerCase()
                        .includes(
                            searchText
                        ) ||
                    item.employee_name
                        ?.toLowerCase()
                        .includes(
                            searchText
                        ) ||
                    item.name
                        ?.toLowerCase()
                        .includes(
                            searchText
                        )
            );
        }, [
            attendance,
            search,
        ]);

    // --------------------------------------------------
    // Employee Records
    //
    // IMPORTANT:
    // Since current API is date-filtered,
    // this only contains currently fetched records.
    // --------------------------------------------------
    const employeeRecords =
        selectedEmployee
            ? attendance.filter(
                (item) =>
                    item.employee_id ===
                    selectedEmployee.employee_id
            )
            : [];

    // --------------------------------------------------
    // Calendar Helpers
    // --------------------------------------------------
    const year =
        currentMonth.getFullYear();

    const month =
        currentMonth.getMonth();

    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();

    const previousMonth = () => {
        setCurrentMonth(
            new Date(
                year,
                month - 1,
                1
            )
        );

        setSelectedDate(null);
    };

    const nextMonth = () => {
        setCurrentMonth(
            new Date(
                year,
                month + 1,
                1
            )
        );

        setSelectedDate(null);
    };

    const monthName =
        currentMonth.toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric",
            }
        );

    const getDateString = (
        day
    ) => {
        return `${year}-${String(
            month + 1
        ).padStart(2, "0")}-${String(
            day
        ).padStart(2, "0")}`;
    };

    const getAttendanceForDate = (
        date
    ) => {
        return employeeRecords.find(
            (item) =>
                item.attendance_date ===
                date
        );
    };

    const selectedDateAttendance =
        selectedDate
            ? getAttendanceForDate(
                selectedDate
            )
            : null;

    // --------------------------------------------------
    // View Employee Calendar
    // --------------------------------------------------
    const handleViewEmployee = (
        item
    ) => {
        setSelectedEmployee(item);

        setSelectedDate(
            item.attendance_date
        );

        setCurrentMonth(
            new Date(
                `${item.attendance_date}T00:00:00`
            )
        );

        // Wait until calendar is rendered
        setTimeout(() => {
            calendarRef.current?.scrollIntoView(
                {
                    behavior: "smooth",
                    block: "start",
                }
            );
        }, 100);
    };

    // --------------------------------------------------
    // Pagination Info
    // --------------------------------------------------
    const pageSize = 10;

    const startRecord =
        totalCount === 0
            ? 0
            : (page - 1) *
            pageSize +
            1;

    const endRecord =
        Math.min(
            page * pageSize,
            totalCount
        );

    const totalPages =
        Math.ceil(
            totalCount / pageSize
        ) || 1;

    return (
        <div className="min-h-full bg-gray-50 p-6">

            {/* ==========================================
                HEADER
            ========================================== */}
            <div className="mb-6 flex items-center justify-between">

                <div>
                    <h1 className="text-2xl font-semibold text-ettm-blue">
                        Attendance History
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Monitor employee attendance
                        and working hours.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        fetchAttendance(
                            page,
                            filterDate
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

            {/* ERROR */}
            {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* ==========================================
                ATTENDANCE TABLE
            ========================================== */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">

                {/* FILTER HEADER */}
                <div className="border-b border-gray-200 px-5 py-4">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

                        <div>

                            <h2 className="text-lg font-semibold text-gray-800">
                                Attendance
                            </h2>

                            <p className="mt-1 text-xs text-gray-500">
                                {formatDate(
                                    filterDate
                                )}
                            </p>

                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

                            {/* DATE FILTER */}
                            <div>

                                <label
                                    htmlFor="attendance_date"
                                    className="mb-1 block text-xs font-medium text-gray-600"
                                >
                                    Attendance Date
                                </label>

                                <input
                                    id="attendance_date"
                                    type="date"
                                    value={
                                        filterDate
                                    }
                                    max={
                                        getTodayString()
                                    }
                                    onChange={(e) => {
                                        setFilterDate(
                                            e.target.value
                                        );

                                        setPage(1);

                                        setSearch("");

                                        setSelectedEmployee(
                                            null
                                        );

                                        setSelectedDate(
                                            null
                                        );
                                    }}
                                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
                                />

                            </div>

                            {/* EMPLOYEE SEARCH */}
                            <div className="sm:w-72">

                                <label
                                    htmlFor="attendance_search"
                                    className="mb-1 block text-xs font-medium text-gray-600"
                                >
                                    Search Employee
                                </label>

                                <input
                                    id="attendance_search"
                                    type="text"
                                    value={
                                        search
                                    }
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Name or Employee ID..."
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
                                />

                            </div>

                            {/* TODAY BUTTON */}
                            {filterDate !==
                                getTodayString() && (

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFilterDate(
                                                getTodayString()
                                            );

                                            setPage(1);
                                            setSearch("");
                                        }}
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Today
                                    </button>

                                )}

                        </div>

                    </div>

                </div>

                {/* LOADING */}
                {loading ? (

                    <div className="py-14 text-center">

                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-ettm-blue" />

                        <p className="mt-3 text-sm text-gray-500">
                            Loading attendance...
                        </p>

                    </div>

                ) : filteredAttendance.length ===
                    0 ? (

                    <div className="py-14 text-center">

                        <p className="text-sm font-medium text-gray-600">
                            No attendance records found
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                            No attendance is available
                            for{" "}
                            {formatDate(
                                filterDate
                            )}.
                        </p>

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
                                    (
                                        item,
                                        index
                                    ) => (

                                        <tr
                                            key={
                                                item.id ||
                                                `${item.employee_id}-${index}`
                                            }
                                            className="hover:bg-gray-50"
                                        >

                                            {/* EMPLOYEE */}
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

                                            {/* DATE */}
                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {formatDate(
                                                    item.attendance_date
                                                )}
                                            </td>

                                            {/* PUNCH IN */}
                                            <td className="px-5 py-4 text-sm text-gray-600">
                                                {formatTime(
                                                    item.punch_in
                                                )}
                                            </td>

                                            {/* PUNCH OUT */}
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

                                            {/* DURATION */}
                                            <td className="px-5 py-4 text-sm font-medium text-gray-700">
                                                {formatDuration(
                                                    item.total_seconds
                                                )}
                                            </td>

                                            {/* VIEW */}
                                            <td className="px-5 py-4 text-center">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleViewEmployee(
                                                            item
                                                        )
                                                    }
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
                                            startRecord
                                        }
                                    </span>
                                    {" - "}
                                    <span className="font-medium text-gray-700">
                                        {
                                            endRecord
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
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>

                                {/* CURRENT PAGE */}
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
                                    className="rounded-lg bg-ettm-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>

                            </div>

                        </div>

                    )}

            </div>

            {/* ==========================================
                EMPLOYEE CALENDAR
            ========================================== */}
            {selectedEmployee && (

                <div
                    ref={calendarRef}
                    className="scroll-mt-6 rounded-xl border border-gray-200 bg-white shadow-sm"
                >

                    {/* Calendar Header */}
                    <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">

                        <div>

                            <h2 className="text-lg font-semibold text-gray-800">
                                Employee Attendance
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                {selectedEmployee.employee_name ||
                                    selectedEmployee.name ||
                                    "-"}{" "}
                                (
                                {selectedEmployee.employee_id ||
                                    "-"}
                                )
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setSelectedEmployee(
                                    null
                                );

                                setSelectedDate(
                                    null
                                );
                            }}
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
                                    type="button"
                                    onClick={
                                        previousMonth
                                    }
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                                >
                                    ←
                                </button>

                                <h3 className="text-lg font-semibold text-gray-800">
                                    {monthName}
                                </h3>

                                <button
                                    type="button"
                                    onClick={
                                        nextMonth
                                    }
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
                                            key={
                                                day
                                            }
                                            className="border-b border-r bg-gray-50 px-2 py-3 text-center text-xs font-semibold text-gray-500"
                                        >
                                            {
                                                day
                                            }
                                        </div>

                                    )
                                )}

                                {Array.from({
                                    length:
                                        firstDay,
                                }).map(
                                    (
                                        _,
                                        index
                                    ) => (

                                        <div
                                            key={`empty-${index}`}
                                            className="min-h-[80px] border-b border-r bg-gray-50"
                                        />

                                    )
                                )}

                                {Array.from({
                                    length:
                                        daysInMonth,
                                }).map(
                                    (
                                        _,
                                        index
                                    ) => {
                                        const day =
                                            index +
                                            1;

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
                                                key={
                                                    date
                                                }
                                                onClick={() =>
                                                    setSelectedDate(
                                                        date
                                                    )
                                                }
                                                className={`min-h-[80px] border-b border-r p-2 text-left transition ${isSelected
                                                    ? "bg-blue-50"
                                                    : "bg-white hover:bg-gray-50"
                                                    }`}
                                            >

                                                <div className="flex items-start justify-between">

                                                    <span className="text-sm font-medium text-gray-700">
                                                        {
                                                            day
                                                        }
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

                                            {/* PUNCH IN */}
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

                                            {/* PUNCH OUT */}
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

                                            {/* HOURS */}
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

                                            {/* STATUS */}
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
                                                No attendance data is
                                                available for this date.
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