import React from "react";

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  padding = "medium",
  className = "",
}) => {
  const paddingStyles = {
    none: "",
    small: "p-4",
    medium: "p-5",
    large: "p-6",
  };

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}

            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>

          {headerAction && <div className="ml-4">{headerAction}</div>}
        </div>
      )}

      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  );
};

export default Card;
