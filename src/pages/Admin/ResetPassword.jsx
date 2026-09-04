import React, { useEffect, useState } from "react";

import { getAllEmployees, resetEmployeePassword } from "../../api/employeeApi";

const ResetPassword = () => {
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [resetting, setResetting] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [search, setSearch] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [resetResult, setResetResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Visual feedback states
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // --------------------------------------------------
  // Fetch Employees
  // --------------------------------------------------
  const fetchEmployees = async (searchValue = "") => {
    try {
      setLoadingEmployees(true);
      setErrorMessage("");

      const data = await getAllEmployees({
        page: 1,
        search: searchValue.trim(),
      });

      if (Array.isArray(data)) {
        setEmployees(data);
      } else if (Array.isArray(data?.results)) {
        setEmployees(data.results);
      } else if (Array.isArray(data?.data)) {
        setEmployees(data.data);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);

      setErrorMessage(
        error?.response?.data?.detail || "Failed to load employees.",
      );

      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // --------------------------------------------------
  // Initial Load
  // --------------------------------------------------
  // useEffect(() => {
  //     fetchEmployees();
  // }, []);

  // --------------------------------------------------
  // Search Employees from Backend
  // --------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees(search);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  // --------------------------------------------------
  // Handle Search Change
  // --------------------------------------------------
  const handleSearchChange = (e) => {
    const value = e.target.value;

    setSearch(value);

    // Clear previous selection
    setSelectedEmployee("");

    setSuccessMessage("");
    setErrorMessage("");
  };

  // --------------------------------------------------
  // Clear Search
  // --------------------------------------------------
  const handleClearSearch = () => {
    setSearch("");
    setSelectedEmployee("");
    setSuccessMessage("");
    setErrorMessage("");
  };

  // --------------------------------------------------
  // Reset Password
  // --------------------------------------------------
  const handleResetPassword = async () => {
    if (!selectedEmployee) {
      setErrorMessage("Please select an employee.");

      return;
    }

    try {
      setResetting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await resetEmployeePassword(selectedEmployee);

      setResetResult(response);

      setShowModal(true);

      setSuccessMessage("Password reset successfully.");
    } catch (error) {
      console.error("Reset password error:", error);

      const backendError = error?.response?.data;

      if (typeof backendError === "string") {
        setErrorMessage(backendError);
      } else if (backendError?.detail) {
        setErrorMessage(backendError.detail);
      } else if (backendError) {
        setErrorMessage(Object.values(backendError).flat().join(" "));
      } else {
        setErrorMessage("Failed to reset password.");
      }
    } finally {
      setResetting(false);
    }
  };

  // --------------------------------------------------
  // Copy Password
  // --------------------------------------------------
  const handleCopyPassword = async () => {
    if (!resetResult?.new_temporary_password) {
      return;
    }

    try {
      await navigator.clipboard.writeText(resetResult.new_temporary_password);

      setCopied(true);
      setTimeout(() => setCopied(false), 2500);

      setSuccessMessage("Temporary password copied to clipboard!");
    } catch (error) {
      console.error("Copy failed:", error);

      setErrorMessage("Unable to copy password.");
    }
  };

  // --------------------------------------------------
  // Download Credentials
  // --------------------------------------------------
  const handleDownload = () => {
    if (!resetResult) {
      return;
    }

    setDownloading(true);

    const content = `
Employee Password Reset Credentials
===================================

Employee ID: ${resetResult.employee_id}
Temporary Password: ${resetResult.new_temporary_password}

Please ask the employee to change the temporary password after logging in.
`;

    const blob = new Blob([content], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `${resetResult.employee_id}-password-reset.txt`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setTimeout(() => {
      setDownloading(false);
      setSuccessMessage("Credentials downloaded successfully as .txt file.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 600);
  };

  // --------------------------------------------------
  // Close Modal (Selection clear kar diya hai yahan)
  // --------------------------------------------------
  const closeModal = () => {
    setShowModal(false);
    setResetResult(null);
    setSelectedEmployee(""); // Selection reset ho jayega
    setCopied(false);
  };

  return (
    <div className="w-full min-h-full bg-gray-50/50 p-6 lg:p-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ettm-blue">
          Reset Employee Password
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Search for an employee from the directory and securely reset their
          password.
        </p>
      </div>

      {/* Success Banner */}
      {successMessage && !showModal && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-800 shadow-xs">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">
            ✓
          </span>
          {successMessage}
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm font-semibold text-rose-800 shadow-xs">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white text-xs">
            !
          </span>
          {errorMessage}
        </div>
      )}

      {/* Main Full-Width Responsive Card */}
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 lg:p-8 shadow-xs">
        <h2 className="text-lg font-semibold text-gray-800">
          Select Employee Account
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Search by employee name, employee ID, or designation.
        </p>

        {/* Search Box */}
        <div className="mt-6">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-600">
            Search Directory
          </label>

          <div className="flex gap-3">
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Type employee name, ID or designation..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-ettm-blue focus:ring-2 focus:ring-ettm-blue/20"
            />

            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Clear
              </button>
            )}
          </div>

          {search && (
            <p className="mt-2 text-xs text-gray-400">
              Filtering records for "{search}"
            </p>
          )}
        </div>

        {/* Employee List Box */}
        <div className="mt-6 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50 divide-y divide-gray-100">
          {loadingEmployees ? (
            <div className="p-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-ettm-blue border-t-transparent"></div>
              Loading employees list...
            </div>
          ) : employees.length > 0 ? (
            employees.map((employee) => {
              const isSelected = selectedEmployee === employee.employee_id;

              return (
                <button
                  key={employee.id || employee.employee_id}
                  type="button"
                  onClick={() => setSelectedEmployee(employee.employee_id)}
                  className={`flex w-full items-center justify-between px-5 py-4 text-left transition ${
                    isSelected
                      ? "bg-blue-50/90 border-l-4 border-ettm-blue shadow-xs"
                      : "hover:bg-white bg-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Selection Indicator Icon Symbol */}
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                        isSelected
                          ? "bg-ettm-blue text-white"
                          : "border border-gray-300 bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {employee.name}
                      </p>

                      <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>
                          ID:{" "}
                          <strong className="text-gray-700">
                            {employee.employee_id}
                          </strong>
                        </span>

                        <span>•</span>

                        <span>
                          {employee.designation_title || "General Staff"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-ettm-blue">
                      Selected
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-gray-500">
                No employees found.
              </p>

              {search && (
                <p className="mt-1 text-xs text-gray-400">
                  No records matched "{search}".
                </p>
              )}
            </div>
          )}
        </div>

        {/* Selected Employee Info Box */}
        {selectedEmployee && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/70 p-4 transition">
            <p className="text-xs font-bold uppercase tracking-wider text-ettm-blue">
              Selected Target Account
            </p>

            <div className="mt-1 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Employee ID:{" "}
                <span className="font-bold text-gray-900">
                  {selectedEmployee}
                </span>
              </p>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                Ready to Reset ✓
              </span>
            </div>
          </div>
        )}

        {/* Reset Button Container */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={!selectedEmployee || resetting}
            className="inline-flex items-center gap-2 rounded-xl bg-ettm-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resetting && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            )}
            {resetting ? "Processing Reset..." : "Reset Password"}
          </button>
        </div>
      </div>

      {/* PASSWORD RESET MODAL */}
      {showModal && resetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    Password Reset Successful
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Temporary credentials generated securely.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center font-bold transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                <p className="text-xs font-semibold text-emerald-800">
                  {resetResult.message}
                </p>
              </div>

              {/* Employee ID */}
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Employee ID
                </p>

                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="font-semibold text-gray-800">
                    {resetResult.employee_id}
                  </p>
                </div>
              </div>

              {/* Temporary Password */}
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                  New Temporary Password
                </p>

                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 py-3">
                    <p className="break-all font-mono text-sm font-bold text-gray-900">
                      {resetResult.new_temporary_password}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className={`rounded-xl border px-4.5 py-3 text-xs font-bold transition-all active:scale-95 ${
                      copied
                        ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {copied ? "Copied! ✓" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <p className="text-xs leading-relaxed text-amber-800 font-medium">
                  ⚠️ Save or download this password now. It will not be shown
                  again.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="rounded-xl border border-gray-300 bg-white px-4.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                {downloading ? "Downloading... ⏳" : "Download .txt"}
              </button>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl bg-ettm-blue px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
