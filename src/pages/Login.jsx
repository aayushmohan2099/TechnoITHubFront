import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
                employee_id: formData.employee_id.trim(),
                password: formData.password,
                role: formData.role,
            };

            console.log("=================================");
            console.log("LOGIN REQUEST");
            console.log(loginData);
            console.log("=================================");

            const response = await loginUser(loginData);

            console.log("=================================");
            console.log("LOGIN API RESPONSE");
            console.log(response);
            console.log("=================================");

            // Check what API actually returned
            console.log("Access:", response?.access);
            console.log("Refresh:", response?.refresh);
            console.log("Role:", formData.role);

            // Make sure tokens exist
            if (!response?.access || !response?.refresh) {
                console.error(
                    "Tokens were not found in API response."
                );

                alert(
                    "Login API succeeded but access/refresh token was not found."
                );

                return;
            }

            // ==========================================
            // SAVE TOKENS
            // ==========================================

            localStorage.setItem(
                "access_token",
                response.access
            );

            localStorage.setItem(
                "refresh_token",
                response.refresh
            );

            // ==========================================
            // SAVE USER INFORMATION
            // ==========================================

            localStorage.setItem(
                "employee_id",
                formData.employee_id.trim()
            );

            localStorage.setItem(
                "role",
                formData.role
            );

            // ==========================================
            // VERIFY LOCAL STORAGE
            // ==========================================

            console.log("=================================");
            console.log("LOCAL STORAGE");
            console.log(
                "access_token:",
                localStorage.getItem("access_token")
            );

            console.log(
                "refresh_token:",
                localStorage.getItem("refresh_token")
            );

            console.log(
                "employee_id:",
                localStorage.getItem("employee_id")
            );

            console.log(
                "role:",
                localStorage.getItem("role")
            );
            console.log("=================================");

            // ==========================================
            // REDIRECT
            // ==========================================

            if (formData.role === "admin") {

                console.log(
                    "ADMIN LOGIN SUCCESSFUL"
                );

                console.log(
                    "Navigating to /admin/dashboard..."
                );

                navigate("/admin/dashboard", {
                    replace: true,
                });

                return;
            }

            if (formData.role === "employee") {

                console.log(
                    "EMPLOYEE LOGIN SUCCESSFUL"
                );

                // Employee route can be added later
                navigate("/employee/dashboard", {
                    replace: true,
                });

                return;
            }

        } catch (error) {
            console.error("=================================");
            console.error("LOGIN FAILED");
            console.error(error);
            console.error("=================================");

            console.error(
                "Status:",
                error.response?.status
            );

            console.error(
                "Response:",
                error.response?.data
            );

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
        <div className="flex min-h-screen items-center justify-center px-4">

            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="mb-6 flex justify-center">
                    <img
                        src={logo}
                        alt="ETTM Logo"
                        className="h-20 w-auto object-contain"
                    />
                </div>

                <Card
                    title="Login"
                    subtitle="Sign in to your ETTM account"
                    padding="large"
                >

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
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
                                className={`w-full rounded-lg border bg-ettm-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all ${errors.role
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

                        {/* Password */}
                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password}
                            disabled={loading}
                            required
                        />

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