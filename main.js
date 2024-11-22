const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const UdpBroadcast = require("./broadcast/udp-broadcast");

// Enable live reload for Electron app
require("electron-reload")(path.join(__dirname, "renderer"), {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"), // Ensure correct Electron binary path
});

let mainWindow;
let broadcaster;

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

app.whenReady().then(createWindow);

ipcMain.handle("start-broadcast", async (event, { ip, port }) => {
  try {
    const filePath = path.join(__dirname, "assets", "Animal_I_Have_Become_1716571270259703154.wav");
    broadcaster = new UdpBroadcast(ip, port);
    broadcaster.startBroadcast(filePath);
    return { status: "success" }; // Inform the renderer process
  } catch (error) {
    console.error("Failed to start broadcast:", error);
    return { status: "error", message: error.message };
  }
});

ipcMain.handle("stop-broadcast", async () => {
  try {
    if (broadcaster) broadcaster.stopBroadcast();
    return { status: "success" };
  } catch (error) {
    console.error("Failed to stop broadcast:", error);
    return { status: "error", message: error.message };
  }
});


app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
