import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProfileIcon = () => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
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
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    const handleLogout = () => {
        // Remove authentication tokens
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        // Optional: remove other login-related data
        localStorage.removeItem("role");
        localStorage.removeItem("employee_id");

        // Close dropdown
        setOpen(false);

        // Go to login
        navigate("/login", { replace: true });
    };

    return (
        <div
            className="relative"
            ref={dropdownRef}
        >
            {/* Profile Button */}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-ettm-blue text-white transition hover:opacity-90"
                aria-label="Profile menu"
            >
                <span className="text-lg">
                    👤
                </span>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-red-600"
                    >
                        <span>↪</span>
                        <span>Logout</span>
                    </button>

                </div>
            )}
        </div>
    );
};

export default ProfileIcon;