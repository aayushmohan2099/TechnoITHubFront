import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, KeyRound, LogOut, Trash2, UserRound } from "lucide-react";

import {
    deleteProfilePicture,
    updateProfilePicture,
} from "../../api/authApi";

const getStoredUser = () => {
    try {
        const currentEmployeeId = localStorage.getItem("employee_id");

        if (!currentEmployeeId) {
            return {};
        }

        const userKey = `user_data_${currentEmployeeId}`;
        const savedUser = JSON.parse(localStorage.getItem(userKey) || "{}");

        if (savedUser?.employee_id && savedUser.employee_id !== currentEmployeeId) {
            return {};
        }

        if (savedUser && Object.keys(savedUser).length > 0) {
            return savedUser;
        }

        const fallbackUser = JSON.parse(localStorage.getItem("user_data") || "{}");
        if (fallbackUser?.employee_id && fallbackUser.employee_id === currentEmployeeId) {
            return fallbackUser;
        }

        return {};
    } catch (error) {
        return {};
    }
};

const saveUserForCurrentEmployee = (userData) => {
    const employeeId = localStorage.getItem("employee_id") || userData?.employee_id || "";

    if (employeeId) {
        localStorage.setItem(`user_data_${employeeId}`, JSON.stringify(userData));
    }

    localStorage.setItem("user_data", JSON.stringify(userData));
};

const normalizeProfilePictureUrl = (value) => {
    if (!value || typeof value !== "string") {
        return "";
    }

    const trimmedValue = value.trim();
    if (!trimmedValue || ["null", "undefined", ""].includes(trimmedValue.toLowerCase())) {
        return "";
    }

    if (trimmedValue.startsWith("blob:") || trimmedValue.startsWith("data:")) {
        return trimmedValue;
    }

    if (trimmedValue.includes("66.116.207.88")) {
        return "";
    }

    if (trimmedValue.startsWith("http://") || trimmedValue.startsWith("https://") || trimmedValue.startsWith("/")) {
        return trimmedValue;
    }

    return trimmedValue;
};

const ProfileIcon = () => {
    const [open, setOpen] = useState(false);
    const [userData, setUserData] = useState(getStoredUser());
    const [uploading, setUploading] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const storedEmployeeId = userData?.employee_id || localStorage.getItem("employee_id") || "";
    const storedUserName = userData?.name || "User";
    const headerName = storedUserName || storedEmployeeId || "User";
    const userName = storedUserName || storedEmployeeId || "User";
    const userRole =
        (userData?.role || localStorage.getItem("role") || "employee").toLowerCase();
    const profilePicture = userData?.profile_picture || "";

    useEffect(() => {
        setImageFailed(false);
    }, [profilePicture]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const refreshUserData = () => {
        setUserData(getStoredUser());
    };

    const handleProfileUpdate = (updatedData) => {
        const current = getStoredUser();
        const merged = { ...current, ...updatedData };

        if (merged.profile_picture) {
            merged.profile_picture = normalizeProfilePictureUrl(merged.profile_picture);
        } else {
            merged.profile_picture = "";
        }

        saveUserForCurrentEmployee(merged);
        refreshUserData();
    };

    const handleProfilePhotoChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const localPreview = URL.createObjectURL(file);

        try {
            setUploading(true);
            setImageFailed(false);
            handleProfileUpdate({
                profile_picture: localPreview,
                name: userName,
                role: userRole,
            });

            const response = await updateProfilePicture(file);
            const rawImageUrl =
                response?.profile_picture ||
                response?.data?.profile_picture ||
                response?.user?.profile_picture ||
                response?.image ||
                response?.url ||
                "";

            const finalImageUrl = normalizeProfilePictureUrl(rawImageUrl) || localPreview;
            const serverUser = response?.user || response?.data?.user || {};

            handleProfileUpdate({
                profile_picture: finalImageUrl,
                name: response?.name || serverUser?.name || userName,
                role: response?.role || serverUser?.role || userRole,
            });
        } catch (error) {
            console.error("Profile picture upload failed:", error);
            handleProfileUpdate({
                profile_picture: localPreview,
                name: userName,
                role: userRole,
            });
            alert(error?.response?.data?.detail || "Unable to upload profile picture.");
        } finally {
            setUploading(false);
            event.target.value = "";
            setOpen(false);
        }
    };

    const handleRemoveProfilePhoto = async () => {
        try {
            setUploading(true);
            await deleteProfilePicture();
            handleProfileUpdate({ profile_picture: "" });
        } catch (error) {
            console.error("Profile picture delete failed:", error);
            alert(error?.response?.data?.detail || "Unable to remove profile picture.");
        } finally {
            setUploading(false);
            setOpen(false);
        }
    };

    const handleLogout = () => {
        const currentEmployeeId = localStorage.getItem("employee_id");

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("role");
        localStorage.removeItem("employee_id");
        localStorage.removeItem("must_change_password");

        if (currentEmployeeId) {
            localStorage.setItem("last_logged_in_employee_id", currentEmployeeId);
        }

        setOpen(false);
        navigate("/login", { replace: true });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-3">
                <span className="hidden text-sm font-medium text-gray-700 sm:block">
                    {headerName}
                </span>

                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-ettm-blue text-white shadow-sm transition hover:opacity-90"
                    aria-label="Profile menu"
                >
                    {profilePicture && !imageFailed ? (
                        <img
                            src={profilePicture}
                            alt={userName}
                            className="h-full w-full object-cover"
                            onError={() => setImageFailed(true)}
                        />
                    ) : (
                        <span className="text-sm font-semibold">
                            {userName?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                    )}
                </button>
            </div>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    <div className="border-b border-gray-100 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-ettm-blue text-white">
                                {profilePicture && !imageFailed ? (
                                    <img
                                        src={profilePicture}
                                        alt={userName}
                                        className="h-full w-full object-cover"
                                        onError={() => setImageFailed(true)}
                                    />
                                ) : (
                                    <UserRound size={18} />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                                <p className="text-xs text-gray-500">{storedEmployeeId || "Employee"}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                        disabled={uploading}
                    >
                        <Camera size={16} />
                        <span>{uploading ? "Updating..." : "Upload photo"}</span>
                    </button>

                    {profilePicture && (
                        <button
                            type="button"
                            onClick={handleRemoveProfilePhoto}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                            disabled={uploading}
                        >
                            <Trash2 size={16} />
                            <span>Remove photo</span>
                        </button>
                    )}

                    {userRole === "employee" && (
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                navigate("/employee/change-password");
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                        >
                            <KeyRound size={16} />
                            <span>Change Password</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-red-600"
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePhotoChange}
            />
        </div>
    );
};

export default ProfileIcon;