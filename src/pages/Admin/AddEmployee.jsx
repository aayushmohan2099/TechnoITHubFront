import React, { useState } from "react";

import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";

import { createEmployee } from "../../api/employeeApi";

const AddEmployee = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone_number: "",
        designation: "",
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Employee credentials returned by API
    const [employeeCredentials, setEmployeeCredentials] = useState({
        employee_id: "",
        temporary_password: "",
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

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

        if (!formData.name.trim()) {
            newErrors.name = "Name is required.";
        }

        if (!formData.email.trim()) {
            newErrors.email = "Email is required.";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
        ) {
            newErrors.email = "Please enter a valid email.";
        }

        if (!formData.phone_number.trim()) {
            newErrors.phone_number = "Phone number is required.";
        } else if (!/^\d{10}$/.test(formData.phone_number)) {
            newErrors.phone_number =
                "Phone number must be exactly 10 digits.";
        }

        if (!formData.designation.trim()) {
            newErrors.designation = "Designation is required.";
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

            const employeeData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone_number: formData.phone_number.trim(),
                designation: formData.designation.trim(),
            };

            console.log("Create Employee Request:", employeeData);

            const response = await createEmployee(employeeData);

            console.log("Create Employee Response:", response);

            /*
             * Expected backend response:
             *
             * {
             *     employee_id: "EMP001",
             *     temporary_password: "Abc@1234"
             * }
             */

            setEmployeeCredentials({
                employee_id: response.employee_id,
                temporary_password: response.temporary_password,
            });

            // Open credentials modal
            setIsModalOpen(true);

            // Reset copy state
            setCopied(false);

            // Clear form
            setFormData({
                name: "",
                email: "",
                phone_number: "",
                designation: "",
            });

            setErrors({});
        } catch (error) {
            console.error("Create Employee Failed:", error);

            console.error(
                "Status:",
                error.response?.status
            );

            console.error(
                "Response:",
                error.response?.data
            );

            const backendMessage =
                error.response?.data?.message ||
                error.response?.data?.detail ||
                error.response?.data?.error;

            alert(
                backendMessage ||
                "Unable to create employee. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            name: "",
            email: "",
            phone_number: "",
            designation: "",
        });

        setErrors({});
    };

    // Copy credentials
    const handleCopy = async () => {
        const credentials = `Employee ID: ${employeeCredentials.employee_id}
Temporary Password: ${employeeCredentials.temporary_password}`;

        try {
            await navigator.clipboard.writeText(credentials);

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (error) {
            console.error("Copy failed:", error);

            alert("Unable to copy credentials.");
        }
    };

    // Download credentials
    const handleDownload = () => {
        const credentials = `Employee Credentials
======================

Employee ID: ${employeeCredentials.employee_id}

Temporary Password: ${employeeCredentials.temporary_password}
`;

        const blob = new Blob(
            [credentials],
            {
                type: "text/plain",
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = `employee-${employeeCredentials.employee_id}-credentials.txt`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    return (
        <>
            {/* ================================
                ADD EMPLOYEE PAGE
            ================================= */}

            <div className="p-6">

                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Add Employee
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Create a new employee account.
                    </p>
                </div>

                <Card
                    title="Employee Details"
                    subtitle="Enter the employee information below."
                    padding="large"
                >
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >

                        <div>
                            <h3 className="mb-4 text-base font-semibold text-ettm-blue">
                                Employee Information
                            </h3>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                {/* Name */}
                                <Input
                                    label="Name"
                                    name="name"
                                    type="text"
                                    placeholder="Enter employee name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    error={errors.name}
                                    required
                                />

                                {/* Email */}
                                <Input
                                    label="Email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter employee email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={errors.email}
                                    required
                                />

                                {/* Phone */}
                                <Input
                                    label="Phone Number"
                                    name="phone_number"
                                    type="tel"
                                    placeholder="Enter 10-digit phone number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    error={errors.phone_number}
                                    maxLength={10}
                                    required
                                />

                                {/* Designation */}
                                <Input
                                    label="Designation"
                                    name="designation"
                                    type="text"
                                    placeholder="Enter employee designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    error={errors.designation}
                                    required
                                />

                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">

                            <Button
                                type="button"
                                variant="outline"
                                size="medium"
                                onClick={handleReset}
                                disabled={loading}
                            >
                                Reset
                            </Button>

                            <Button
                                type="submit"
                                variant="primary"
                                size="medium"
                                loading={loading}
                            >
                                Add Employee
                            </Button>

                        </div>

                    </form>
                </Card>
            </div>

            {/* ================================
                EMPLOYEE CREDENTIALS MODAL
            ================================= */}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Employee Created Successfully"
                size="medium"
            >

                {/* Success message */}
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-medium text-green-700">
                        Employee account has been created successfully.
                    </p>
                </div>

                <p className="mb-5 text-sm text-gray-600">
                    Please save the following credentials and securely
                    share them with the employee.
                </p>

                {/* Employee ID */}
                <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Employee ID
                    </label>

                    <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50 px-4 py-3">
                        <span className="flex-1 text-base font-semibold text-gray-900">
                            {employeeCredentials.employee_id}
                        </span>
                    </div>
                </div>

                {/* Temporary Password */}
                <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                        Temporary Password
                    </label>

                    <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50 px-4 py-3">
                        <span className="flex-1 font-mono text-base font-semibold text-gray-900">
                            {employeeCredentials.temporary_password}
                        </span>
                    </div>
                </div>

                {/* Security warning */}
                <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <p className="text-xs leading-5 text-yellow-800">
                        Please share these credentials securely with
                        the employee. The employee should change the
                        temporary password after their first login.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">

                    <Button
                        type="button"
                        variant="outline"
                        size="medium"
                        onClick={handleCopy}
                    >
                        {copied
                            ? "Copied!"
                            : "Copy Credentials"}
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        size="medium"
                        onClick={handleDownload}
                    >
                        Download
                    </Button>

                    <Button
                        type="button"
                        variant="primary"
                        size="medium"
                        onClick={() => setIsModalOpen(false)}
                    >
                        Done
                    </Button>

                </div>

            </Modal>
        </>
    );
};

export default AddEmployee;