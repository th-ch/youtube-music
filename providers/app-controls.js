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
    app.relaunch();
    app.exit();
}
