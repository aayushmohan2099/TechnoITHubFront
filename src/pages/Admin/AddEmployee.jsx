import React, { useState } from "react";

import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

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

            alert("Employee created successfully!");

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

    return (
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

                    {/* Employee Details */}
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
    );
};

export default AddEmployee;