import React from "react";
import logo from "../../../assets/thlogo.png";
import ProfileIcon from "../ProfileIcon";

const Header = () => {
    return (
        <header className="w-full border-b border-gray-200 bg-white shadow-sm">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                {/* Logo / Brand */}
                <div className="flex items-center gap-3">
                    <img
                        src={logo}
                        alt="ETTM Logo"
                        className="h-12 w-auto object-contain"
                    />

                    <div>
                        <h1 className="text-lg font-bold text-ettm-blue">
                            ETTM
                        </h1>

                        <p className="text-xs text-gray-500">
                            Employee Task & Training Management
                        </p>
                    </div>
                </div>

                {/* Profile */}
                <ProfileIcon />

            </div>
        </header>
    );
};

export default Header;