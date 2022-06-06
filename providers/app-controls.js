const is = require("electron-is");

const { app, BrowserWindow, ipcMain, ipcRenderer } = require("electron");
const config = require("../config");

module.exports.restart = () => {
    is.main() ? restart() : ipcRenderer.send('restart');
};

module.exports.setupAppControls = () => {
    ipcMain.on('restart', restart);
    ipcMain.handle('getDownloadsFolder', () => app.getPath("downloads"));
    ipcMain.on('reload', () => BrowserWindow.getFocusedWindow().webContents.loadURL(config.get("url")));
}

function restart() {
    app.relaunch({ execPath: process.env.PORTABLE_EXECUTABLE_FILE });
    // execPath will be undefined if not running portable app, resulting in default behavior
    app.quit();
}
