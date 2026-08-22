import axiosInstance from "./axiosInstance";

export const createEmployee = async (employeeData) => {
    const response = await axiosInstance.post(
        "api/v1/accounts/admin/create-employee/",
        employeeData
    );

    return response.data;
};
// Get All Employees
export const getAllEmployees = async () => {
    const accessToken = localStorage.getItem("access_token");

    const response = await axiosInstance.get(
        "api/v1/employees/profiles/",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    return response.data;
};