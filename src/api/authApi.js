import axiosInstance from "./axiosInstance";

export const loginUser = async (loginData) => {
    const response = await axiosInstance.post(
        "api/v1/accounts/login/",
        loginData
    );

    return response.data;
};