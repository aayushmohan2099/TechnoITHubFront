const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // ==========================================
  // GET INSTALLED APP VERSION
  // ==========================================

  getAppVersion: () => {
    return ipcRenderer.invoke("get-app-version");
  },

  // ==========================================
  // UPDATE INFORMATION
  // ==========================================

  onUpdateInfo: (callback) => {
    const listener = (_event, data) => {
      callback(data);
    };

    ipcRenderer.on("update-info", listener);

    return () => {
      ipcRenderer.removeListener("update-info", listener);
    };
  },

  // ==========================================
  // DOWNLOAD PROGRESS
  // ==========================================

  onUpdateProgress: (callback) => {
    const listener = (_event, percent) => {
      callback(percent);
    };

    ipcRenderer.on("update-progress", listener);

    return () => {
      ipcRenderer.removeListener("update-progress", listener);
    };
  },

  // ==========================================
  // DOWNLOAD FINISHED
  // ==========================================

  onUpdateDownloaded: (callback) => {
    const listener = () => {
      callback();
    };

    ipcRenderer.on("update-downloaded", listener);

    return () => {
      ipcRenderer.removeListener("update-downloaded", listener);
    };
  },

  // ==========================================
  // UPDATE ERROR
  // ==========================================

  onUpdateError: (callback) => {
    const listener = (_event, message) => {
      callback(message);
    };

    ipcRenderer.on("update-error", listener);

    return () => {
      ipcRenderer.removeListener("update-error", listener);
    };
  },
});
