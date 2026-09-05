const { app, BrowserWindow, nativeImage, Menu, ipcMain } = require("electron");

const path = require("path");
const fs = require("fs");
const os = require("os");
const http = require("http");
const https = require("https");
const { spawn } = require("child_process");

// ======================================================
// UPDATE CONFIGURATION
// ======================================================

const BACKEND_BASE_URL = "http://66.116.207.88:14250";

const UPDATE_CHECK_URL = `${BACKEND_BASE_URL}/api/v1/updates/check/`;

let mainWindow = null;
let updateWindow = null;

// ======================================================
// GET ICON
// ======================================================

function getAppIcon() {
  const iconPath = path.join(__dirname, "icon.ico");

  const appIcon = nativeImage.createFromPath(iconPath);

  if (appIcon.isEmpty()) {
    console.error("Electron icon could not be loaded:", iconPath);
  }

  return appIcon;
}

// ======================================================
// CREATE NORMAL ETTM WINDOW
// ======================================================

function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();

    return;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,

    minWidth: 1000,
    minHeight: 700,

    icon: getAppIcon(),

    autoHideMenuBar: true,

    webPreferences: {
      nodeIntegration: false,

      contextIsolation: true,

      preload: path.join(__dirname, "preload.js"),
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.setMenuBarVisibility(false);

  mainWindow.setMenu(null);

  // ====================================================
  // DEVELOPMENT
  // ====================================================

  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
  }

  // ====================================================
  // PRODUCTION
  // ====================================================
  else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ======================================================
// CREATE UPDATE WINDOW
// ======================================================

function createUpdateWindow(update) {
  return new Promise((resolve, reject) => {
    // ==================================================
    // PREVENT DUPLICATE UPDATE WINDOW
    // ==================================================

    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.focus();

      updateWindow.webContents.send("update-info", update);

      resolve();

      return;
    }

    updateWindow = new BrowserWindow({
      width: 600,
      height: 600,

      resizable: false,

      maximizable: false,

      fullscreenable: false,

      autoHideMenuBar: true,

      icon: getAppIcon(),

      webPreferences: {
        nodeIntegration: false,

        contextIsolation: true,

        preload: path.join(__dirname, "preload.js"),
      },
    });

    Menu.setApplicationMenu(null);

    updateWindow.setMenu(null);

    // ==================================================
    // DEVELOPMENT UPDATE PAGE
    // ==================================================

    if (!app.isPackaged) {
      updateWindow.loadURL("http://localhost:5173/?mode=update");
    }

    // ==================================================
    // PRODUCTION UPDATE PAGE
    // ==================================================
    else {
      updateWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
        query: {
          mode: "update",
        },
      });
    }

    // ==================================================
    // SEND UPDATE INFORMATION
    // ==================================================

    updateWindow.webContents.once("did-finish-load", () => {
      updateWindow.webContents.send("update-info", update);

      resolve();
    });

    // ==================================================
    // UPDATE PAGE LOAD ERROR
    // ==================================================

    updateWindow.webContents.once(
      "did-fail-load",
      (_event, errorCode, errorDescription) => {
        reject(new Error(`${errorCode}: ${errorDescription}`));
      },
    );

    updateWindow.on("closed", () => {
      updateWindow = null;
    });
  });
}

// ======================================================
// CHECK UPDATE API
// ======================================================

async function checkForUpdates() {
  try {
    // ==================================================
    // CURRENT INSTALLED VERSION
    // ==================================================

    const currentVersion = app.getVersion();

    console.log("Installed ETTM version:", currentVersion);

    // ==================================================
    // CREATE UPDATE API URL
    // ==================================================

    const url =
      `${UPDATE_CHECK_URL}?version=` + encodeURIComponent(currentVersion);

    console.log("Checking update:", url);

    // ==================================================
    // CALL BACKEND UPDATE API
    // ==================================================

    const response = await fetch(url, {
      method: "GET",

      headers: {
        Accept: "application/json",
      },
    });

    // ==================================================
    // API ERROR
    // ==================================================

    if (!response.ok) {
      throw new Error(`Update API failed with status ${response.status}`);
    }

    // ==================================================
    // API RESPONSE
    // ==================================================

    const data = await response.json();

    console.log("Update API Response:", data);

    console.log("Backend update_available:", data.update_available);

    // ==================================================
    // BACKEND SAYS NO UPDATE
    // ==================================================
    //
    // Example:
    //
    // {
    //   update_available: false
    // }
    //
    // Open ETTM normally.
    //
    // ==================================================

    if (!data.update_available) {
      console.log("Backend says no update available.");

      return {
        updateAvailable: false,

        data,
      };
    }

    // ==================================================
    // BACKEND SAYS UPDATE AVAILABLE
    // ==================================================

    console.log("Backend says update is available.");

    // ==================================================
    // DOWNLOAD URL REQUIRED
    // ==================================================

    if (!data.download_url) {
      throw new Error("Update available but download_url is missing.");
    }

    // ==================================================
    // BUILD FINAL DOWNLOAD URL
    // ==================================================

    let downloadUrl;

    // ==================================================
    // FULL URL
    // ==================================================
    //
    // Example:
    //
    // http://server/media/builds/ETTM_v1.0.2.exe
    //
    // ==================================================

    if (/^https?:\/\//i.test(data.download_url)) {
      downloadUrl = data.download_url;
    }

    // ==================================================
    // RELATIVE URL
    // ==================================================
    //
    // Backend example:
    //
    // builds/03-09-26/ETTM_v1.0.2.exe
    //
    // Final:
    //
    // http://server/media/builds/...
    //
    // ==================================================
    else {
      let normalizedPath = data.download_url.trim();

      // Accept all of these backend formats:
      // /media/builds/.../ETTM_v1.0.1.exe
      // media/builds/.../ETTM_v1.0.1.exe
      // builds/.../ETTM_v1.0.1.exe
      if (normalizedPath.startsWith("/media/")) {
        // already correct
      } else if (normalizedPath.startsWith("media/")) {
        normalizedPath = `/${normalizedPath}`;
      } else if (normalizedPath.startsWith("/builds/")) {
        normalizedPath = `/media${normalizedPath}`;
      } else if (normalizedPath.startsWith("builds/")) {
        normalizedPath = `/media/${normalizedPath}`;
      } else if (!normalizedPath.startsWith("/")) {
        normalizedPath = `/${normalizedPath}`;
      }

      downloadUrl = new URL(normalizedPath, `${BACKEND_BASE_URL}/`).toString();
    }

    console.log("Final Download URL:", downloadUrl);

    // ==================================================
    // RETURN UPDATE
    // ==================================================

    return {
      updateAvailable: true,

      data: {
        ...data,

        download_url: downloadUrl,
      },
    };
  } catch (error) {
    console.error("Update check failed:", error);

    // ==================================================
    // IF UPDATE API FAILS
    // ==================================================
    //
    // Do not block the user from using ETTM.
    //
    // ==================================================

    return {
      updateAvailable: false,

      error,
    };
  }
}

// ======================================================
// DOWNLOAD UPDATE
// ======================================================

function downloadUpdate(update) {
  return new Promise((resolve, reject) => {
    // ==================================================
    // DOWNLOAD URL
    // ==================================================

    const downloadUrl = update.download_url;

    const parsedUrl = new URL(downloadUrl);

    // ==================================================
    // HTTP / HTTPS
    // ==================================================

    const client = parsedUrl.protocol === "https:" ? https : http;

    // ==================================================
    // TEMP FILE NAME
    // ==================================================

    const fileName = `ETTM-${update.latest_version || "update"}.exe`;

    // ==================================================
    // TEMP INSTALLER PATH
    // ==================================================

    const installerPath = path.join(
      os.tmpdir(),

      fileName,
    );

    console.log("Saving installer to:", installerPath);

    // ==================================================
    // DELETE PREVIOUS TEMP INSTALLER
    // ==================================================

    try {
      if (fs.existsSync(installerPath)) {
        fs.unlinkSync(installerPath);
      }
    } catch (error) {
      console.error("Unable to remove old installer:", error);
    }

    // ==================================================
    // CREATE INSTALLER FILE
    // ==================================================

    const fileStream = fs.createWriteStream(installerPath);

    // ==================================================
    // START DOWNLOAD
    // ==================================================

    const request = client.get(
      downloadUrl,

      (response) => {
        // ============================================
        // HANDLE REDIRECT
        // ============================================

        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          fileStream.close();

          fs.unlink(
            installerPath,

            () => {},
          );

          const redirectedUrl = new URL(
            response.headers.location,

            downloadUrl,
          ).toString();

          console.log("Download redirected to:", redirectedUrl);

          // ==========================================
          // DOWNLOAD REDIRECTED FILE
          // ==========================================

          downloadUpdate({
            ...update,

            download_url: redirectedUrl,
          })
            .then(resolve)
            .catch(reject);

          return;
        }

        // ============================================
        // HTTP DOWNLOAD ERROR
        // ============================================

        if (response.statusCode !== 200) {
          fileStream.close();

          fs.unlink(
            installerPath,

            () => {},
          );

          reject(
            new Error(`Download failed with status ${response.statusCode}`),
          );

          return;
        }

        // ============================================
        // TOTAL DOWNLOAD SIZE
        // ============================================

        const totalBytes = Number(response.headers["content-length"] || 0);

        let downloadedBytes = 0;

        console.log("Total update size:", totalBytes);

        // ============================================
        // DOWNLOAD PROGRESS
        // ============================================

        response.on(
          "data",

          (chunk) => {
            downloadedBytes += chunk.length;

            if (totalBytes > 0) {
              const percent = (downloadedBytes / totalBytes) * 100;

              // ======================================
              // SEND PROGRESS TO REACT
              // ======================================

              if (updateWindow && !updateWindow.isDestroyed()) {
                updateWindow.webContents.send(
                  "update-progress",

                  percent,
                );
              }
            }
          },
        );

        // ============================================
        // WRITE DOWNLOADED DATA
        // ============================================

        response.pipe(fileStream);

        // ============================================
        // DOWNLOAD FINISHED
        // ============================================

        fileStream.on(
          "finish",

          () => {
            fileStream.close(() => {
              console.log("Update downloaded:", installerPath);

              // ====================================
              // TELL REACT DOWNLOAD IS COMPLETE
              // ====================================

              if (updateWindow && !updateWindow.isDestroyed()) {
                updateWindow.webContents.send(
                  "update-progress",

                  100,
                );

                updateWindow.webContents.send("update-downloaded");
              }

              // ====================================
              // RETURN INSTALLER PATH
              // ====================================

              resolve(installerPath);
            });
          },
        );
      },
    );

    // ==================================================
    // HTTP REQUEST ERROR
    // ==================================================

    request.on(
      "error",

      (error) => {
        fileStream.close();

        fs.unlink(
          installerPath,

          () => {},
        );

        reject(error);
      },
    );

    // ==================================================
    // FILE WRITE ERROR
    // ==================================================

    fileStream.on(
      "error",

      (error) => {
        reject(error);
      },
    );
  });
}

// ======================================================
// INSTALL UPDATE - DIRECT NSIS UPDATE + AUTO RELAUNCH
// ======================================================
//
// Flow:
// 1. Download is already complete.
// 2. Start the electron-builder NSIS installer directly.
// 3. Pass --updated, /S and --force-run.
// 4. After the installer process successfully starts,
//    close the old ETTM.
// 5. NSIS installs the new version silently.
// 6. --force-run launches the newly installed ETTM.
//
// ======================================================

function installUpdate(installerPath) {
  console.log("Starting automatic update:", installerPath);

  try {
    if (!fs.existsSync(installerPath)) {
      throw new Error("Installer file does not exist.");
    }

    const updateLogPath = path.join(os.tmpdir(), "ettm-update.log");

    fs.writeFileSync(
      updateLogPath,
      [
        "Updater started from Electron",
        `Old version: ${app.getVersion()}`,
        `Old PID: ${process.pid}`,
        `Old EXE: ${process.execPath}`,
        `Installer: ${installerPath}`,
        "Mode: direct NSIS",
        "",
      ].join("\n"),
      "utf8",
    );

    console.log("Current version:", app.getVersion());
    console.log("Current EXE:", process.execPath);
    console.log("Update installer:", installerPath);
    console.log("Updater log:", updateLogPath);

    // These are the same core arguments used by electron-builder's
    // NSIS updater for a silent update that should relaunch the app.
    const installerArgs = ["--updated", "/S", "--force-run"];

    fs.appendFileSync(
      updateLogPath,
      `Starting installer with args: ${installerArgs.join(" ")}\n`,
      "utf8",
    );

    const installerProcess = spawn(installerPath, installerArgs, {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });

    let appQuitScheduled = false;

    // "spawn" means Windows successfully created the installer process.
    installerProcess.once("spawn", () => {
      fs.appendFileSync(
        updateLogPath,
        `Installer process started. PID: ${installerProcess.pid || "unknown"}\n`,
        "utf8",
      );

      console.log("Installer process started:", installerProcess.pid);

      installerProcess.unref();

      if (!appQuitScheduled) {
        appQuitScheduled = true;

        setTimeout(() => {
          try {
            fs.appendFileSync(updateLogPath, "Closing old ETTM now.\n", "utf8");
          } catch (_) {}

          console.log("Closing old ETTM...");
          app.quit();
        }, 1200);
      }
    });

    // If the installer cannot even be started, keep the old app open
    // and show the error instead of quitting into a broken state.
    installerProcess.once("error", (error) => {
      console.error("Unable to start updater:", error);

      try {
        fs.appendFileSync(
          updateLogPath,
          `Unable to start installer: ${error.code || ""} ${error.message}\n`,
          "utf8",
        );
      } catch (_) {}

      if (updateWindow && !updateWindow.isDestroyed()) {
        updateWindow.webContents.send(
          "update-error",
          error.message || "Unable to start update installer.",
        );
      }
    });
  } catch (error) {
    console.error("Unable to install update:", error);

    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.webContents.send(
        "update-error",
        error.message || "Unable to install update.",
      );
    }
  }
}

// ======================================================
// APP VERSION IPC
// ======================================================

ipcMain.handle(
  "get-app-version",

  () => {
    return app.getVersion();
  },
);

// ======================================================
// APP START
// ======================================================

app.whenReady().then(async () => {
  // ==================================================
  // WINDOWS APP ID
  // ==================================================

  if (process.platform === "win32") {
    app.setAppUserModelId("com.technoithub.ettm");
  }

  // ==================================================
  // DEVELOPMENT MODE
  // ==================================================
  //
  // npm run dev:
  //
  // API CHECK
  //      ↓
  // UPDATE TRUE
  //      ↓
  // SHOW UPDATE PAGE
  //      ↓
  // DOWNLOAD ONLY
  //
  // DOES NOT INSTALL IN DEVELOPMENT
  //
  // ==================================================

  if (!app.isPackaged) {
    console.log("Development mode.");

    const updateResult = await checkForUpdates();

    // ================================================
    // UPDATE AVAILABLE IN DEVELOPMENT
    // ================================================

    if (updateResult.updateAvailable) {
      try {
        const update = updateResult.data;

        console.log("Update available in development.");

        console.log("Download URL:", update.download_url);

        // ============================================
        // SHOW UPDATE PAGE
        // ============================================

        await createUpdateWindow(update);

        // ============================================
        // DOWNLOAD INSTALLER
        // ============================================

        const installerPath = await downloadUpdate(update);

        console.log("Development update download completed.");

        console.log("Installer saved at:", installerPath);

        console.log("Development installer was not started.");

        return;
      } catch (error) {
        console.error(
          "Development update failed:",

          error,
        );

        if (updateWindow && !updateWindow.isDestroyed()) {
          updateWindow.webContents.send(
            "update-error",

            error.message || "Unable to download update.",
          );
        }

        return;
      }
    }

    // ================================================
    // NO UPDATE IN DEVELOPMENT
    // ================================================

    console.log("No update available.");

    createWindow();

    return;
  }

  // ==================================================
  // PRODUCTION / INSTALLED APPLICATION
  // ==================================================

  console.log("Production mode.");

  // Keep a tiny startup trace so we can verify which version actually launched.
  try {
    const startupLogPath = path.join(os.tmpdir(), "ettm-startup.log");
    fs.appendFileSync(
      startupLogPath,
      `[${new Date().toISOString()}] version=${app.getVersion()} exe=${process.execPath}\n`,
      "utf8",
    );
  } catch (error) {
    console.error("Unable to write startup log:", error);
  }

  console.log("Installed ETTM version:", app.getVersion());

  console.log("ETTM executable:", process.execPath);

  console.log("Checking for ETTM update...");

  const updateResult = await checkForUpdates();

  // ==================================================
  // UPDATE AVAILABLE
  // ==================================================

  if (updateResult.updateAvailable) {
    const update = updateResult.data;

    try {
      console.log("Update available.");

      console.log("Installed version:", app.getVersion());

      console.log("Backend latest version:", update.latest_version);

      console.log("Download URL:", update.download_url);

      // ==============================================
      // SHOW UPDATE SCREEN
      // ==============================================

      await createUpdateWindow(update);

      // ==============================================
      // DOWNLOAD INSTALLER
      // ==============================================

      const installerPath = await downloadUpdate(update);

      console.log("Installer downloaded successfully.");

      console.log("Installer path:", installerPath);

      // ==============================================
      // INSTALL UPDATE
      // ==============================================

      setTimeout(
        () => {
          installUpdate(installerPath);
        },

        1500,
      );

      return;
    } catch (error) {
      console.error(
        "Update process failed:",

        error,
      );

      if (updateWindow && !updateWindow.isDestroyed()) {
        updateWindow.webContents.send(
          "update-error",

          error.message || "Unable to update ETTM.",
        );
      }

      return;
    }
  }

  // ==================================================
  // NO UPDATE REQUIRED
  // ==================================================
  //
  // API:
  //
  // update_available = false
  //
  // Open normal application.
  //
  // React then goes to /login.
  //
  // ==================================================

  console.log("No update required.");

  console.log("Opening ETTM normally.");

  createWindow();
});

// ======================================================
// MACOS ACTIVATE
// ======================================================

app.on(
  "activate",

  () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  },
);

// ======================================================
// CLOSE APP
// ======================================================

app.on(
  "window-all-closed",

  () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  },
);
