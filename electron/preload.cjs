// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    onUpdateAvailable: (callback) => ipcRenderer.on("update_available", () => callback()),
    onDownloadProgress: (callback) => ipcRenderer.on("download_progress", (event, percent) => callback(percent)),
    onUpdateDownloaded: (callback) => ipcRenderer.on("update_downloaded", () => callback()),
    restartAndUpdate: () => ipcRenderer.send("restart_to_update"),
});