import React, { useEffect, useMemo, useState } from "react";

import Card from "../../components/common/Card";

import {
  getOverdueTasks,
  getAttendanceHistory,
  getAllTasks,
} from "../../api/employeeApi";

import {
  FaExclamationTriangle,
  FaUsers,
  FaTasks,
  FaClock,
  FaArrowRight,
} from "react-icons/fa";

const Dashboard = () => {
  const employeeId = localStorage.getItem("employee_id");

  const [overdueTasks, setOverdueTasks] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);

  const [presentToday, setPresentToday] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showAllOverdue, setShowAllOverdue] = useState(false);

  // =========================================
  // GET TODAY DATE
  // =========================================

  const today = useMemo(() => {
    return new Date().toISOString().slice(0, 10);
  }, []);

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================
  // DAYS OVERDUE
  // =========================================

  const getDaysOverdue = (deadline) => {
    if (!deadline) return 0;

    const todayDate = new Date();
    const deadlineDate = new Date(deadline);

    todayDate.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    const difference = todayDate.getTime() - deadlineDate.getTime();

    return Math.max(0, Math.floor(difference / (1000 * 60 * 60 * 24)));
  };

  // =========================================
  // EXTRACT RESULTS
  // =========================================

  const extractResults = (response) => {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.results)) {
      return response.results;
    }

    if (Array.isArray(response?.overdue_tasks)) {
      return response.overdue_tasks;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.data?.results)) {
      return response.data.results;
    }

    if (Array.isArray(response?.data?.overdue_tasks)) {
      return response.data.overdue_tasks;
    }

    return [];
  };

  // =========================================
  // FETCH DASHBOARD DATA
  // =========================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [overdueResponse, attendanceResponse, inProgressResponse] =
          await Promise.all([
            getOverdueTasks(),

            getAttendanceHistory({
              page: 1,
              date: today,
            }),

            getAllTasks({
              page: 1,
              status: "In-Progress",
            }),
          ]);

        // =========================
        // OVERDUE TASKS
        // =========================

        const overdueList = extractResults(overdueResponse);

        setOverdueTasks(overdueList);

        setOverdueCount(
          overdueResponse?.count ??
            overdueResponse?.data?.count ??
            overdueList.length,
        );

        // =========================
        // PRESENT TODAY
        // =========================

        const attendanceList = extractResults(attendanceResponse);

        const uniqueEmployees = new Set(
          attendanceList
            .filter((item) => item?.punch_in && item?.employee_id)
            .map((item) => item.employee_id),
        );

        setPresentToday(uniqueEmployees.size);

        // =========================
        // IN PROGRESS COUNT
        // =========================

        const inProgressList = extractResults(inProgressResponse);

        const count =
          inProgressResponse?.count ??
          inProgressResponse?.data?.count ??
          inProgressList.length;

        setInProgressCount(count);
      } catch (error) {
        console.error("Dashboard API Error:", error);

        setErrorMessage(
          error?.response?.data?.detail ||
            error?.response?.data?.message ||
            "Unable to load dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [today]);

  // =========================================
  // PRIORITY STYLE
  // =========================================

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";

      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";

      case "low":
        return "bg-green-100 text-green-700 border-green-200";

      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {/* =====================================
                PAGE HEADER
            ====================================== */}

      <div className="mb-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Monitor attendance and tasks requiring attention.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500 shadow-sm">
            Admin ID:
            <span className="ml-2 font-semibold text-ettm-blue">
              {employeeId || "Admin"}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================
                ERROR
            ====================================== */}

      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* =====================================
                SUMMARY CARDS
            ====================================== */}

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* OVERDUE */}

        <div className="group relative overflow-hidden rounded-2xl border border-red-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute right-0 top-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-red-50" />

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue Tasks</p>

              <h2 className="mt-2 text-3xl font-bold text-red-600">
                {loading ? "..." : overdueCount}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Require immediate attention
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <FaExclamationTriangle size={20} />
            </div>
          </div>
        </div>

        {/* PRESENT TODAY */}

        <div className="group relative overflow-hidden rounded-2xl border border-green-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute right-0 top-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-green-50" />

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Present Today</p>

              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {loading ? "..." : presentToday}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Employees punched in today
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <FaUsers size={20} />
            </div>
          </div>
        </div>

        {/* IN PROGRESS */}

        <div className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute right-0 top-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-blue-50" />

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                In-Progress Tasks
              </p>

              <h2 className="mt-2 text-3xl font-bold text-ettm-blue">
                {loading ? "..." : inProgressCount}
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Currently active tasks
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-ettm-blue">
              <FaTasks size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================
                OVERDUE TASK SECTION
            ====================================== */}

      <Card>
        <div className="mb-5 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <FaClock />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">Overdue Tasks</h2>

              <p className="text-sm text-gray-500">
                Tasks that have crossed their deadline
              </p>
            </div>
          </div>

          <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
            {overdueCount} Overdue
          </div>
        </div>

        {/* LOADING */}

        {loading && (
          <div className="flex min-h-[220px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-ettm-blue" />

              <p className="mt-3 text-sm text-gray-500">Loading dashboard...</p>
            </div>
          </div>
        )}

        {/* EMPTY */}

        {!loading && overdueTasks.length === 0 && (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl bg-green-50">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
              ✓
            </div>

            <h3 className="font-semibold text-gray-900">No overdue tasks</h3>

            <p className="mt-1 text-sm text-gray-500">
              Everything is currently on schedule.
            </p>
          </div>
        )}

        {/* TABLE */}

        {!loading && overdueTasks.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="rounded-l-lg px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Task
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Employee
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Deadline
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Priority
                  </th>

                  <th className="rounded-r-lg px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Overdue By
                  </th>
                </tr>
              </thead>

              <tbody>
                {(showAllOverdue ? overdueTasks : overdueTasks.slice(0, 5)).map(
                  (task) => {
                    const daysOverdue = getDaysOverdue(task.deadline);

                    return (
                      <tr
                        key={task.id}
                        className="border-b border-gray-100 transition hover:bg-red-50/40"
                      >
                        {/* TASK */}

                        <td className="px-4 py-4">
                          <div className="max-w-[250px]">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {task.title || "-"}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              Task ID: {task.id}
                            </p>
                          </div>
                        </td>

                        {/* EMPLOYEE */}

                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-gray-700">
                            {task.assigned_to_name || task.employee_name || "-"}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {task.assigned_to_emp_id || task.employee_id || ""}
                          </p>
                        </td>

                        {/* DEADLINE */}

                        <td className="px-4 py-4 text-sm text-gray-600">
                          {formatDate(task.deadline)}
                        </td>

                        {/* PRIORITY */}

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityClass(
                              task.priority,
                            )}`}
                          >
                            {task.priority || "N/A"}
                          </span>
                        </td>

                        {/* DAYS OVERDUE */}

                        <td className="px-4 py-4">
                          <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
                            <FaClock className="text-red-500" />

                            <span className="text-sm font-bold text-red-600">
                              {daysOverdue} {daysOverdue === 1 ? "Day" : "Days"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW ALL / SHOW LESS */}

        {!loading && overdueTasks.length > 5 && (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setShowAllOverdue((previous) => !previous)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-ettm-blue transition hover:bg-blue-50"
            >
              {showAllOverdue ? "Show Less" : "View All Overdue Tasks"}

              <FaArrowRight
                size={12}
                className={showAllOverdue ? "rotate-180" : ""}
              />
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
