import React, { useState } from "react";

import Card from "../components/common/Card";

import Input from "../components/common/Input";

import Button from "../components/common/Button";

import logo from "../assets/thlogo.png";

const Login = () => {
    const [formData, setFormData] = useState({
        role: "",
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});

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

        // Role validation
        if (!formData.role) {
            newErrors.role = "Please select a role.";
        }

        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address.";
        }

        // Password validation
        if (!formData.password.trim()) {
            newErrors.password = "Password is required.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Frontend-only for now
        console.log("Login data:", formData);

        alert(
            `Login successful!\nRole: ${formData.role}\nEmail: ${formData.email}`
        );
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
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Role */}
                        <div className="w-full">
                            <label
                                htmlFor="role"
                                className="mb-1.5 block text-sm font-medium text-ettm-blue"
                            >
                                Role
                                <span className="ml-1 text-ettm-red">*</span>
                            </label>

                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
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

                        {/* Email */}
                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
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
                            required
                        />

                        {/* Login */}
                        <Button
                            type="submit"
                            variant="primary"
                            size="large"
                            className="w-full"
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