import axiosInstance from "./axiosInstance";

export const loginUser = async (loginData) => {
  const response = await axiosInstance.post(
    "api/v1/accounts/login/",
    loginData,
  );

  return response.data;
};

export const changePassword = async ({ new_password, confirm_password }) => {
  const response = await axiosInstance.post(
    "api/v1/accounts/change-password/",
    {
      new_password,
      confirm_password,
    },
  );

  return response.data;
};

export const updateProfilePicture = async (file) => {
  const formData = new FormData();
  formData.append("profile_picture", file);

  const response = await axiosInstance.patch(
    "api/v1/accounts/update-dp/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const deleteProfilePicture = async () => {
  const response = await axiosInstance.delete("api/v1/accounts/update-dp/");

  return response.data;
};
