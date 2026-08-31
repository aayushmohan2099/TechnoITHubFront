import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

import logo from "../assets/thlogo.png";

import { loginUser } from "../api/authApi";

const Login = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        role: "",
        employee_id: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [loginError, setLoginError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: "",
        }));

        // Remove the previous API error when the user edits a field
        setLoginError("");
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.role) {
            newErrors.role = "Please select a role.";
        }

        if (!formData.employee_id.trim()) {
            newErrors.employee_id = "Employee ID is required.";
        }

        if (!formData.password.trim()) {
            newErrors.password = "Password is required.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const getLoginErrorMessage = (error) => {
        const apiData = error?.response?.data;

        if (typeof apiData === "string") {
            return apiData;
        }

        if (apiData?.detail) {
            return Array.isArray(apiData.detail)
                ? apiData.detail[0]
                : apiData.detail;
        }

        if (apiData?.message) {
            return Array.isArray(apiData.message)
                ? apiData.message[0]
                : apiData.message;
        }

        if (apiData?.non_field_errors?.[0]) {
            return apiData.non_field_errors[0];
        }

        if (apiData?.employee_id?.[0]) {
            return apiData.employee_id[0];
        }

        if (apiData?.password?.[0]) {
            return apiData.password[0];
        }

        if (!error?.response) {
            return "Unable to connect to the server. Please check your connection.";
        }

        if (error.response.status === 401) {
            return "Incorrect employee ID, password, or role. Please try again.";
        }

        if (error.response.status === 403) {
            return "You do not have permission to access this account.";
        }

        if (error.response.status >= 500) {
            return "The server is currently unavailable. Please try again later.";
        }

        return "Login failed. Please check your details and try again.";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoginError("");

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            const trimmedEmployeeId = formData.employee_id.trim();

            const loginData = {
                role: formData.role,
                employee_id: trimmedEmployeeId,
                password: formData.password,
            };

            const response = await loginUser(loginData);

            if (!response?.access || !response?.refresh) {
                throw new Error(
                    "Unable to complete login. Authentication tokens were not received."
                );
            }

            const userRole = String(
                response?.role ||
                response?.user?.role ||
                formData.role ||
                ""
            ).toLowerCase();

            if (!["admin", "employee"].includes(userRole)) {
                throw new Error("The server returned an invalid user role.");
            }

            const employeeKey = `user_data_${trimmedEmployeeId}`;

            let previousUser = {};

            try {
                const savedEmployee = JSON.parse(
                    localStorage.getItem(employeeKey) || "null"
                );

                if (
                    savedEmployee &&
                    typeof savedEmployee === "object"
                ) {
                    previousUser = savedEmployee;
                }
            } catch (storageError) {
                console.error(
                    "Unable to read stored user information:",
                    storageError
                );
            }

            const profilePictureFromResponse =
                response?.profile_picture ||
                response?.data?.profile_picture ||
                response?.user?.profile_picture ||
                response?.avatar ||
                response?.url ||
                "";

<<<<<<< Updated upstream
            const safeProfilePicture =
                profilePictureFromResponse &&
                !profilePictureFromResponse.includes("66.116.207.88")
                    ? profilePictureFromResponse
                    : previousUser?.profile_picture || "";
=======
            const safeProfilePicture = profilePictureFromResponse || previousUser.profile_picture || "";
>>>>>>> Stashed changes

            const userDetails = {
                employee_id:
                    response?.employee_id ||
                    response?.user?.employee_id ||
                    trimmedEmployeeId,

                name:
                    response?.name ||
                    response?.user?.name ||
                    trimmedEmployeeId,

                role: userRole,

                profile_picture: safeProfilePicture,

                must_change_password: Boolean(
                    response?.must_change_password ??
                    response?.user?.must_change_password
                ),
            };

<<<<<<< Updated upstream
            const currentEmployeeKey =
                `user_data_${userDetails.employee_id}`;

            localStorage.setItem(
                "access_token",
                response.access
            );

            localStorage.setItem(
                "refresh_token",
                response.refresh
            );

            localStorage.setItem(
                "employee_id",
                userDetails.employee_id
            );

            localStorage.setItem(
                "role",
                userRole
            );

            localStorage.setItem(
                "must_change_password",
                String(userDetails.must_change_password)
            );

            localStorage.setItem(
                "user_data",
                JSON.stringify(userDetails)
            );

            localStorage.setItem(
                currentEmployeeKey,
                JSON.stringify(userDetails)
            );
=======
            const currentEmployeeKey = `user_data_${userDetails.employee_id}`;
            localStorage.setItem(currentEmployeeKey, JSON.stringify(userDetails));
            localStorage.setItem("access_token", response.access);
            localStorage.setItem("refresh_token", response.refresh);
            localStorage.setItem("employee_id", userDetails.employee_id);
            localStorage.setItem("role", userRole);
            localStorage.setItem("must_change_password", String(userDetails.must_change_password));
            localStorage.setItem("user_data", JSON.stringify(userDetails));
>>>>>>> Stashed changes

            if (userRole === "admin") {
                navigate("/admin/dashboard", {
                    replace: true,
                });

                return;
            }

            if (userDetails.must_change_password) {
                navigate("/employee/change-password", {
                    replace: true,
                });

                return;
            }

            navigate("/employee/dashboard", {
                replace: true,
            });
        } catch (error) {
            console.error("LOGIN FAILED:", error);

            let message;

            if (
                error?.message ===
                "Unable to complete login. Authentication tokens were not received."
            ) {
                message = error.message;
            } else if (
                error?.message ===
                "The server returned an invalid user role."
            ) {
                message = error.message;
            } else {
                message = getLoginErrorMessage(error);
            }

            setLoginError(message);

            // Clear only the incorrect password
            setFormData((previous) => ({
                ...previous,
                password: "",
            }));

            setShowPassword(false);
        } finally {
            // Always enable the form again
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md">
                <Card
                    padding="large"
                    className="rounded-2xl border border-gray-100 bg-white shadow-xl"
                >
<<<<<<< Updated upstream
                    {/* Logo */}
=======
>>>>>>> Stashed changes
                    <div className="mb-4 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ettm-blue/10 p-3 shadow-sm">
                            <img
                                src={logo}
                                alt="ETTM Logo"
                                className="h-full w-full object-contain"
                            />
                        </div>
                    </div>

<<<<<<< Updated upstream
                    {/* Heading */}
=======
>>>>>>> Stashed changes
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Login
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Sign in to your ETTM account
                        </p>
                    </div>

                    {/* Login API error */}
                    {loginError && (
                        <div
                            role="alert"
                            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {loginError}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                        noValidate
                    >
                        {/* Role */}
                        <div className="w-full">
                            <label
                                htmlFor="role"
                                className="mb-1.5 block text-sm font-medium text-ettm-blue"
                            >
                                Role

                                <span className="ml-1 text-ettm-red">
                                    *
                                </span>
                            </label>

                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                disabled={loading}
                                className={`w-full rounded-lg border bg-ettm-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                                    errors.role
                                        ? "border-ettm-red focus:border-ettm-red focus:ring-2 focus:ring-ettm-red/10"
                                        : "border-gray-300 focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/10"
                                }`}
                            >
                                <option value="">
                                    Select Role
                                </option>

                                <option value="admin">
                                    Admin
                                </option>

                                <option value="employee">
                                    Employee
                                </option>
                            </select>

                            {errors.role && (
                                <p className="mt-1 text-xs text-ettm-red">
                                    {errors.role}
                                </p>
                            )}
                        </div>

                        <Input
                            label="Employee ID"
                            name="employee_id"
                            type="text"
                            placeholder="Enter your employee ID"
                            value={formData.employee_id}
                            onChange={handleChange}
                            error={errors.employee_id}
                            disabled={loading}
                            required
                        />

<<<<<<< Updated upstream
                        {/* Password */}
=======
>>>>>>> Stashed changes
                        <div className="relative">
                            <Input
                                label="Password"
                                name="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                error={errors.password}
                                disabled={loading}
                                required
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(
                                        (previous) => !previous
                                    )
                                }
                                disabled={loading}
                                className="absolute right-3 top-[38px] text-gray-500 transition hover:text-gray-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>

<<<<<<< Updated upstream
                        {/* Login button */}
=======
>>>>>>> Stashed changes
                        <Button
                            type="submit"
                            variant="primary"
                            size="large"
                            className="w-full"
                            loading={loading}
                            disabled={loading}
                        >
                            {loading
                                ? "Logging in..."
                                : "Login"}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default Login;