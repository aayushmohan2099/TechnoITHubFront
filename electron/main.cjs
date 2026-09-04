const {
    app,
     BrowserWindow,
     nativeImage,
     Menu,
     ipcMain, // Added
} = require("electron");

const path = require("path");
const { autoUpdater } = require("electron-updater"); // Added
const log = require("electron-log"); // Optional: for logging

// Auto-updater logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

function createWindow() {
    const iconPath = path.join(
        __dirname,
        "../src/assets/logo.png"
    );

    const appIcon = nativeImage.createFromPath(iconPath);

    if (appIcon.isEmpty()) {
        console.error(
            "Electron icon could not be loaded:",
            iconPath
        );
    }

    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        icon: appIcon,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"), // Preload script added
        },
    });

    Menu.setApplicationMenu(null);
    win.setMenuBarVisibility(false);
    win.setMenu(null);

    if (!app.isPackaged) {
        win.loadURL("http://localhost:5173");
    } else {
        win.loadFile(
            path.join(
                __dirname,
                "../dist/index.html"
            )
        );
    }

    // ==========================================
    // Auto-Updater Events
    // ==========================================
    win.once("ready-to-show", () => {
        if (app.isPackaged) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    });

    autoUpdater.on("update-available", () => {
        win.webContents.send("update_available");
    });

    autoUpdater.on("download-progress", (progressObj) => {
        win.webContents.send("download_progress", progressObj.percent);
    });

    autoUpdater.on("update-downloaded", () => {
        win.webContents.send("update_downloaded");
    });
}

// User jab UI se restart button dabaye
ipcMain.on("restart_to_update", () => {
    autoUpdater.quitAndInstall();
});

app.whenReady().then(() => {
    if (process.platform === "win32") {
        app.setAppUserModelId(
            "com.technoithub.ettm"
        );
    }

    createWindow();

    app.on("activate", () => {
        if (
            BrowserWindow.getAllWindows().length === 0
        ) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});