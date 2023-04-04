const path = require("path");

const { app, BrowserWindow, ipcMain, ipcRenderer } = require("electron");
const config = require("../config");

module.exports.restart = () => {
  process.type === 'browser' ? restart() : ipcRenderer.send('restart');
};

module.exports.setupAppControls = () => {
    ipcMain.on('restart', restart);
    ipcMain.handle('getDownloadsFolder', () => app.getPath("downloads"));
    ipcMain.on('reload', () => BrowserWindow.getFocusedWindow().webContents.loadURL(config.get("url")));
	ipcMain.handle('getPath', (_, ...args) => path.join(...args));
}

function restart() {
    app.relaunch({ execPath: process.env.PORTABLE_EXECUTABLE_FILE });
    // execPath will be undefined if not running portable app, resulting in default behavior
    app.quit();
}

function sendToFront(channel, ...args) {
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send(channel, ...args);
    });
}

module.exports.sendToFront =
  process.type === 'browser'
    ? sendToFront
    : () => {
        console.error('sendToFront called from renderer');
      };
