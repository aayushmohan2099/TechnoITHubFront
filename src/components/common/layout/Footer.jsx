import React from "react";

const Footer = () => {
  return (
    <footer className="w-full border-t border-gray-200 bg-white">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} ETTM. All rights reserved.
        </p>

        <p className="text-xs text-gray-500">
          Employee Task & Training Management
        </p>
      </div>
    </footer>
  );
};

export default Footer;
