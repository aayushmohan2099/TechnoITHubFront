import React from "react";

const Input = ({
  label,
  name,
  type = "text",
  value = "",
  placeholder = "",
  onChange,
  onBlur,
  error = "",
  helperText = "",
  disabled = false,
  required = false,
  readOnly = false,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          {label}

          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400
          ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          }
          ${disabled ? "cursor-not-allowed bg-gray-100 text-gray-500" : ""}
          ${className}`}
        {...props}
      />

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {!error && helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
