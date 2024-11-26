const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  startBroadcast: (config) => ipcRenderer.invoke("start-broadcast", config),
  stopBroadcast: () => ipcRenderer.invoke("stop-broadcast"),
  selectAudioFile: () => ipcRenderer.invoke("select-audio-file"),
  openAudioSourcesWindow: () => ipcRenderer.invoke("open-audio-sources-window"),
  getAudioDevices: () => ipcRenderer.invoke("get-audio-devices"),
});
