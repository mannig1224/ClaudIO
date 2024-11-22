const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  startBroadcast: (config) => ipcRenderer.invoke("start-broadcast", config),
  stopBroadcast: () => ipcRenderer.invoke("stop-broadcast"),
});
