import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldAlert } from "lucide-react";

import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

import { changePassword } from "../../api/authApi";

const ChangePassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        new_password: "",
        confirm_password: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: "",
            ["submit"]: "",
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.new_password.trim()) {
            newErrors.new_password = "New password is required.";
        } else if (formData.new_password.length < 8) {
            newErrors.new_password = "New password must be at least 8 characters.";
        }

        if (!formData.confirm_password.trim()) {
            newErrors.confirm_password = "Please confirm your new password.";
        } else if (formData.new_password !== formData.confirm_password) {
            newErrors.confirm_password = "Passwords do not match.";
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
            setErrors({});

            await changePassword({
                new_password: formData.new_password,
                confirm_password: formData.confirm_password,
            });

            localStorage.setItem("must_change_password", "false");

            const storedUser = JSON.parse(localStorage.getItem("user_data") || "{}");
            const updatedUser = {
                ...storedUser,
                must_change_password: false,
            };
            localStorage.setItem("user_data", JSON.stringify(updatedUser));

            navigate("/employee/dashboard", { replace: true });
        } catch (error) {
            const backendMessage =
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                error?.response?.data?.non_field_errors ||
                error?.message ||
                "Unable to change password right now.";

            setErrors({
                submit: typeof backendMessage === "string" ? backendMessage : "Unable to change password right now.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-full items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-lg">
                <Card
                    padding="large"
                    className="rounded-2xl border border-gray-100 bg-white shadow-xl"
                >
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
                        <ShieldAlert className="h-5 w-5" />
                        <p className="text-sm font-medium">
                            This password change is required on your first login.
                        </p>
                    </div>

                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Change Password
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Set a new password to continue.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative">
                            <Input
                                label="New Password"
                                name="new_password"
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                value={formData.new_password}
                                onChange={handleChange}
                                error={errors.new_password}
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword((prev) => !prev)}
                                className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="relative">
                            <Input
                                label="Confirm New Password"
                                name="confirm_password"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Re-enter new password"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                error={errors.confirm_password}
                                disabled={loading}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {errors.submit && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {errors.submit}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            size="large"
                            className="w-full"
                            loading={loading}
                        >
                            Change Password
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default ChangePassword;
