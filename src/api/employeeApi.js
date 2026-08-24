import axiosInstance from "./axiosInstance";

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

export const getAllEmployees = async () => {
    const response = await axiosInstance.get(
        "api/v1/employees/profiles/"
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