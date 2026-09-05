import React, { useEffect, useState } from "react";
import logo from "../assets/thlogo.png";

const Update = () => {
  const [progress, setProgress] = useState(0);

  const [latestVersion, setLatestVersion] = useState("");

  const [status, setStatus] = useState("Preparing update...");

  const [error, setError] = useState("");

  useEffect(() => {
    if (!window.electronAPI) {
      return;
    }

    // ==========================================
    // UPDATE INFORMATION
    // ==========================================

    const removeUpdateInfo = window.electronAPI.onUpdateInfo((data) => {
      setLatestVersion(data?.latest_version || "");

      setStatus("Starting download...");
    });

    // ==========================================
    // DOWNLOAD PROGRESS
    // ==========================================

    const removeProgress = window.electronAPI.onUpdateProgress((percent) => {
      const safePercent = Math.max(0, Math.min(100, Math.round(percent)));

      setProgress(safePercent);

      setStatus("Downloading update...");
    });

    // ==========================================
    // DOWNLOAD COMPLETED
    // ==========================================

    const removeDownloaded = window.electronAPI.onUpdateDownloaded(() => {
      setProgress(100);

      setStatus("Download completed. Installing update...");
    });

    // ==========================================
    // UPDATE ERROR
    // ==========================================

    const removeError = window.electronAPI.onUpdateError((message) => {
      setError(message || "Unable to update ETTM.");

      setStatus("Update failed.");
    });

    // ==========================================
    // CLEANUP
    // ==========================================

    return () => {
      removeUpdateInfo?.();
      removeProgress?.();
      removeDownloaded?.();
      removeError?.();
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white px-10 py-12 text-center shadow-xl">
        {/* LOGO */}

        <img
          src={logo}
          alt="ETTM"
          className="mx-auto mb-6 h-20 w-auto object-contain"
        />

        {/* HEADING */}

        <h1 className="text-2xl font-bold text-[#164C88]">Updating ETTM</h1>

        <p className="mt-2 text-sm text-gray-500">
          A newer version of ETTM is available.
        </p>

        {/* VERSION */}

        {latestVersion && (
          <div className="mt-5 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-[#164C88]">
            Version {latestVersion}
          </div>
        )}

        {/* PROGRESS */}

        <div className="mt-8">
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-[#DC2728] transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <p className="mt-3 text-lg font-bold text-[#164C88]">{progress}%</p>
        </div>

        {/* STATUS */}

        <p className="mt-2 text-sm text-gray-500">{status}</p>

        {/* ERROR */}

        {error && (
          <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {!error && (
          <p className="mt-6 text-xs text-gray-400">
            Please wait while ETTM installs the latest update.
          </p>
        )}
      </div>
    </div>
  );
};

export default Update;
