// =========================
// Imports
// =========================
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { exec } = require("child_process");
const path = require("path");
const UdpBroadcast = require("./broadcast/udp-broadcast");

// Enable live reload for Electron app
require("electron-reload")(path.join(__dirname, "renderer"), {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"), // Ensure correct Electron binary path
});

// =========================
// Global Variables
// =========================
let mainWindow;
let broadcaster;
let audioSourceWindow;

// =========================
// Main Window Creation
// =========================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 700,
    minWidth: 320,
    maxWidth: 400,
    minHeight: 600,
    maxHeight: 700,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  mainWindow.loadFile("./renderer/home/home.html");
}

// =========================
// IPC Handlers
// =========================

// Start Broadcast
ipcMain.handle("start-broadcast", async (event, { ip, port, filePath }) => {
  try {
    const audioFilePath = filePath || path.join(__dirname, "assets", "Animal_I_Have_Become_1716571270259703154.wav");
    broadcaster = new UdpBroadcast(ip, port);
    broadcaster.startBroadcast(audioFilePath);
    console.log(`Broadcasting file: ${audioFilePath} to ${ip}:${port}`);
    return { status: "success" };
  } catch (error) {
    console.error("Failed to start broadcast:", error);
    return { status: "error", message: error.message };
  }
});

// Stop Broadcast
ipcMain.handle("stop-broadcast", async () => {
  console.log("Stopping broadcast...");
  try {
    if (broadcaster) broadcaster.stopBroadcast();
    return { status: "success" };
  } catch (error) {
    console.error("Failed to stop broadcast:", error);
    return { status: "error", message: error.message };
  }
});

// Select Audio File
ipcMain.handle("select-audio-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Audio Files", extensions: ["mp3", "wav", "ogg", "flac"] },
    ],
  });

  if (result.canceled) {
    return null; // User canceled the dialog
  }

  return result.filePaths[0]; // Return the selected file path
});

// Open Audio Sources Window
ipcMain.handle("open-audio-sources-window", async () => {
  if (audioSourceWindow) {
    audioSourceWindow.focus();
    return;
  }

  audioSourceWindow = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  audioSourceWindow.loadFile("./renderer/audio-sources/audio-sources.html");

  audioSourceWindow.on("closed", () => {
    audioSourceWindow = null;
  });
});

// Get Audio Devices
ipcMain.handle("get-audio-devices", async () => {
  return new Promise((resolve, reject) => {
    exec('ffmpeg -list_devices true -f dshow -i dummy', (error, stdout, stderr) => {
      if (error) {
        console.error("Error listing devices:", error);
        return reject(error);
      }

      // Parse the output for device names
      const devices = [];
      const lines = stderr.split("\n");
      for (const line of lines) {
        const match = line.match(/"([^"]+)" \((audio)\)/i);
        if (match) {
          devices.push(match[1]);
        }
      }

      resolve(devices);
    });
  });
});

// =========================
// App Lifecycle
// =========================
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
