import React from "react";
import logo from "../../../assets/thlogo.png";
import ProfileIcon from "../ProfileIcon";
import Button from "../Button";

const Header = () => {

    // Reload the entire application
    const handleReload = () => {
        window.location.reload();
    };

    return (
        <header className="w-full border-b border-gray-200 bg-white shadow-sm">
            <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                {/* Logo / Brand */}
                <div className="flex items-center gap-3">

                    {/* Logo */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 border border-gray-200 p-1.5 shadow-sm">
                        <img
                            src={logo}
                            alt="ETTM Logo"
                            className="h-full w-full object-contain"
                        />
                    </div>

                    <div>
                        <h1 className="text-xl font-extrabold tracking-wide text-ettm-blue font-sans">
                            ETTM
                        </h1>

                        <p className="text-xs font-medium text-gray-500 tracking-wide">
                            Employee Task & Training Management
                        </p>
                    </div>
                </div>


                {/* Right Side */}
                <div className="flex items-center gap-3">

                   
                    {/* Profile */}
                    <ProfileIcon />

                    {/* Reload Button */}
                    <Button
                        variant="outline"
                        size="small"
                        onClick={handleReload}
                    >
                        Reload
                    </Button>

                </div>

            </div>
        </header>
    );
};

export default Header;