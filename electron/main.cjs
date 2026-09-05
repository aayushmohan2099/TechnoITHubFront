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
      const normalizedPath = data.download_url.startsWith("media/")
        ? data.download_url
        : `media/${data.download_url}`;

      downloadUrl = new URL(
        normalizedPath,

        `${BACKEND_BASE_URL}/`,
      ).toString();
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
// INSTALL UPDATE
// ======================================================
//
// FLOW:
//
// Current ETTM
//      ↓
// Download completes
//      ↓
// PowerShell helper starts
//      ↓
// Current ETTM closes
//      ↓
// PowerShell waits for ETTM to close
//      ↓
// NSIS installer starts
//      ↓
// New version installs
//      ↓
// runAfterFinish = true
//      ↓
// Updated ETTM opens
//
// ======================================================

function installUpdate(installerPath) {
  console.log("Starting update installer:", installerPath);

  try {
    // ==================================================
    // VERIFY INSTALLER EXISTS
    // ==================================================

    if (!fs.existsSync(installerPath)) {
      throw new Error("Installer file does not exist.");
    }

    // ==================================================
    // CURRENT ETTM PROCESS ID
    // ==================================================

    const currentPid = process.pid;

    console.log("Current ETTM PID:", currentPid);

    // ==================================================
    // ESCAPE INSTALLER PATH
    // ==================================================

    const escapedInstallerPath = installerPath.replace(
      /'/g,

      "''",
    );

    // ==================================================
    // POWERSHELL HELPER
    // ==================================================
    //
    // PowerShell survives after Electron quits.
    //
    // It waits for the old ETTM process to disappear,
    // then starts the NSIS installer.
    //
    // ==================================================

    const script = `
$oldPid = ${currentPid}
$installerPath = '${escapedInstallerPath}'

while (Get-Process -Id $oldPid -ErrorAction SilentlyContinue) {
    Start-Sleep -Milliseconds 300
}

if (!(Test-Path $installerPath)) {
    exit 1
}

Start-Process -FilePath $installerPath
`;

    // ==================================================
    // START DETACHED POWERSHELL
    // ==================================================

    const updaterProcess = spawn(
      "powershell.exe",

      [
        "-NoProfile",

        "-ExecutionPolicy",

        "Bypass",

        "-WindowStyle",

        "Hidden",

        "-Command",

        script,
      ],

      {
        detached: true,

        stdio: "ignore",

        windowsHide: true,
      },
    );

    // ==================================================
    // POWERSHELL ERROR
    // ==================================================

    updaterProcess.on(
      "error",

      (error) => {
        console.error(
          "Updater helper failed:",

          error,
        );
      },
    );

    // ==================================================
    // LET POWERSHELL CONTINUE AFTER ETTM CLOSES
    // ==================================================

    updaterProcess.unref();

    console.log("Updater helper started.");

    // ==================================================
    // CLOSE CURRENT / OLD ETTM
    // ==================================================

    setTimeout(
      () => {
        console.log("Closing old ETTM...");

        app.quit();
      },

      500,
    );
  } catch (error) {
    console.error(
      "Unable to start installer:",

      error,
    );

    // ==================================================
    // SEND INSTALL ERROR TO UPDATE PAGE
    // ==================================================

    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.webContents.send(
        "update-error",

        error.message || "Unable to start update installer.",
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
