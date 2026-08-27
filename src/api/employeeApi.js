import axiosInstance from "./axiosInstance";

//==========================================
//ADMIN APIs
//=======================================


// ===============================
// CREATE EMPLOYEE
// ===============================

export const createEmployee = async (employeeData) => {
    const response = await axiosInstance.post(
        "api/v1/accounts/admin/create-employee/",
        employeeData
    );

    return response.data;
};


// ===============================
// GET ALL EMPLOYEES
// ===============================

export const getAllEmployees = async ({
    page = 1,
    search = "",
} = {}) => {
    const params = {
        page,
    };

    if (search.trim()) {
        params.search = search.trim();
    }

    const response = await axiosInstance.get(
        "api/v1/employees/profiles/",
        {
            params,
        }
    );

    return response.data;
};


// ===============================
// CREATE / ASSIGN TASK
// ===============================

export const createTask = async (taskData) => {
    const response = await axiosInstance.post(
        "api/v1/tasks/admin/manage/",
        taskData
    );

    return response.data;
};


// ===============================
// RESET EMPLOYEE PASSWORD
// ===============================

export const resetEmployeePassword = async (employeeId) => {
    const response = await axiosInstance.post(
        "api/v1/accounts/admin/reset-password/",
        {
            employee_id: employeeId,
        }
    );

    return response.data;
};

// Get All Tasks
export const getAllTasks = async ({
    page = 1,
    search = "",
} = {}) => {
    const params = {
        page,
    };

    if (search.trim()) {
        params.search = search.trim();
    }

    const response = await axiosInstance.get(
        "api/v1/tasks/admin/manage/",
        {
            params,
        }
    );

    return response.data;
};

// Attendance History
export const getAttendanceHistory = async ({
    page = 1,
    date = "",
} = {}) => {
    const params = {
        page,
    };

    if (date) {
        params.date = date;
    }

    const response = await axiosInstance.get(
        "api/v1/attendance/admin/history/",
        {
            params,
        }
    );

    return response.data;
};

//=====================================
// EMPLOYEE APIs
//=====================================

//Employee Attendance
export const punchAttendance = async () => {
    const response = await axiosInstance.post(
        "api/v1/attendance/employee/punch/"
    );

    return response.data;
};

// Employee Tasks
export const getMyTasks = async () => {
    const response = await axiosInstance.get(
        "api/v1/tasks/employee/my-tasks/"
    );

    return response.data;
};

// =====================================
// EMPLOYEE - UPDATE TASK PROGRESS
// =====================================

export const updateTaskProgress = async (
    taskId,
    progressData
) => {
    const response = await axiosInstance.post(
        `api/v1/tasks/employee/my-tasks/${taskId}/update/`,
        progressData
    );

    return response.data;
};