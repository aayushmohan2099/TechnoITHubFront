import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; // Make sure to install lucide-react if not installed

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
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // Password show/hide state

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

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            const loginData = {
                role: formData.role,
                employee_id: formData.employee_id.trim(),
                password: formData.password,
            };

            const response = await loginUser(loginData);

            if (!response?.access || !response?.refresh) {
                console.error("Tokens were not found in API response.");
                alert("Login API succeeded but access/refresh token was not found.");
                return;
            }

            const userRole = String(
                response?.role || response?.user?.role || ""
            ).toLowerCase();

            const employeeKey = `user_data_${formData.employee_id.trim()}`;
            const previousUser = (() => {
                try {
                    const userFromEmployeeKey = JSON.parse(localStorage.getItem(employeeKey) || "null");
                    if (userFromEmployeeKey && typeof userFromEmployeeKey === "object") {
                        return userFromEmployeeKey;
                    }

                    return JSON.parse(localStorage.getItem("user_data") || "{}");
                } catch (error) {
                    return {};
                }
            })();

            const profilePictureFromResponse =
                response?.profile_picture ||
                response?.user?.profile_picture ||
                response?.avatar ||
                "";

            const safeProfilePicture =
                (profilePictureFromResponse && !profilePictureFromResponse.includes("66.116.207.88"))
                    ? profilePictureFromResponse
                    : previousUser.profile_picture || "";

            const userDetails = {
                employee_id: response?.employee_id || formData.employee_id.trim(),
                name: response?.name || response?.user?.name || formData.employee_id.trim(),
                role: userRole,
                profile_picture: safeProfilePicture,
                must_change_password: Boolean(response?.must_change_password),
            };

            const currentEmployeeKey = `user_data_${userDetails.employee_id}`;
            localStorage.setItem(currentEmployeeKey, JSON.stringify(userDetails));
            localStorage.setItem(`user_data_${userDetails.employee_id}`, JSON.stringify(userDetails));
            localStorage.setItem("access_token", response.access);
            localStorage.setItem("refresh_token", response.refresh);
            localStorage.setItem("employee_id", userDetails.employee_id);
            localStorage.setItem("role", userRole);
            localStorage.setItem("must_change_password", String(userDetails.must_change_password));
            localStorage.setItem("user_data", JSON.stringify(userDetails));

            if (userRole === "admin") {
                navigate("/admin/dashboard", { replace: true });
                return;
            }

            if (userRole === "employee") {
                if (userDetails.must_change_password) {
                    navigate("/employee/change-password", { replace: true });
                    return;
                }

                navigate("/employee/dashboard", { replace: true });
                return;
            }

        } catch (error) {
            console.error("LOGIN FAILED", error);
            alert(
                error.response?.data?.message ||
                error.response?.data?.detail ||
                error.message ||
                "Login failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md">
                <Card
                    padding="large"
                    className="bg-white shadow-xl rounded-2xl border border-gray-100"
                >
                    {/* Logo inside Card at the top */}
                    <div className="mb-4 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ettm-blue/10 p-3 shadow-sm">
                            <img
                                src={logo}
                                alt="ETTM Logo"
                                className="h-full w-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Title & Subtitle inside Card */}
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Login</h2>
                        <p className="mt-1 text-sm text-gray-500">Sign in to your ETTM account</p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
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
                                className={`w-full rounded-lg border bg-ettm-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all ${
                                    errors.role
                                        ? "border-ettm-red focus:border-ettm-red focus:ring-2 focus:ring-ettm-red/10"
                                        : "border-gray-300 focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/10"
                                }`}
                            >
                                <option value="">Select Role</option>
                                <option value="admin">Admin</option>
                                <option value="employee">Employee</option>
                            </select>

                            {errors.role && (
                                <p className="mt-1 text-xs text-ettm-red">
                                    {errors.role}
                                </p>
                            )}
                        </div>

                        {/* Employee ID */}
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

                        {/* Password with Eye Toggle */}
                        <div className="relative">
                            <Input
                                label="Password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                error={errors.password}
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Login */}
                        <Button
                            type="submit"
                            variant="primary"
                            size="large"
                            className="w-full"
                            loading={loading}
                        >
                            Login
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default Login;