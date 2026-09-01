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
    status = "",
    priority = "",
    
} = {}) => {
    const params = {
        page,
        
    };

    if (search.trim()) {
        params.search = search.trim();
    }

    if (status) {
        params.status = status;
    }

    if (priority) {
        params.priority = priority;
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

export const getAttendanceByDate = async (date) => {
    const requestDate = date || new Date().toISOString().slice(0, 10);
    const endpointVariants = [
        { url: "api/v1/attendance/employee/history/", params: { date: requestDate } },
       
    ];

    let lastError = null;

    for (const endpoint of endpointVariants) {
        try {
            const response = await axiosInstance.get(endpoint.url, {
                params: endpoint.params,
            });

            const data = response.data;

            if (Array.isArray(data)) {
                const match = data.find((item) => {
                    const attendanceDate = item?.attendance_date || item?.date || item?.punch_in?.slice(0, 10);
                    return attendanceDate === requestDate;
                }) || data[0] || null;

                return match;
            }

            if (data && Array.isArray(data.results)) {
                const match = data.results.find((item) => {
                    const attendanceDate = item?.attendance_date || item?.date || item?.punch_in?.slice(0, 10);
                    return attendanceDate === requestDate;
                }) || data.results[0] || null;

                return match;
            }

            return data;
        } catch (error) {
            const status = error?.response?.status;
            if (status === 404 || status === 400) {
                lastError = error;
                continue;
            }

            throw error;
        }
    }

    if (lastError) {
        throw lastError;
    }

    return null;
};

// Employee Tasks
export const getMyTasks = async (page = 1) => {
    const response = await axiosInstance.get(
        "api/v1/tasks/employee/my-tasks/",
        {
            params: {
                page,
            },
        }
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