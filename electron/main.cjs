const {
    app,
    BrowserWindow,
    nativeImage,
    Menu,
} = require("electron");

const path = require("path");

function createWindow() {
    const iconPath = path.join(
        __dirname,
        "../src/assets/logo.png"
    );

    const appIcon =
        nativeImage.createFromPath(iconPath);

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

        // Window and Windows taskbar icon
        icon: appIcon,

        // Hide File / Edit / View / Window menu bar
        autoHideMenuBar: true,

        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Remove application menu completely
    Menu.setApplicationMenu(null);

    // Hide menu bar
    win.setMenuBarVisibility(false);

    // Remove menu from this window
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
}

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