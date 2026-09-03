import React from "react";

const Button = ({
  children,
  type = "button",
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  onClick,
  className = "",
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary: "bg-ettm-red text-ettm-white hover:bg-red-700 focus:ring-ettm-red",

    secondary:
      "bg-ettm-blue text-ettm-white hover:bg-blue-900 focus:ring-ettm-blue",

    success:
      "bg-ettm-blue text-ettm-white hover:bg-blue-900 focus:ring-ettm-blue",

    danger: "bg-ettm-red text-ettm-white hover:bg-red-700 focus:ring-ettm-red",

    warning: "bg-ettm-red text-ettm-white hover:bg-red-700 focus:ring-ettm-red",

    outline:
      "border border-ettm-blue bg-ettm-white text-ettm-blue hover:bg-gray-50 focus:ring-ettm-blue",

    ghost:
      "bg-transparent text-ettm-blue hover:bg-gray-100 focus:ring-ettm-blue",
  };

  const sizes = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-sm",
    large: "px-5 py-2.5 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
