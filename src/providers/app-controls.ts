import path from 'node:path';

import { app, BrowserWindow, ipcMain, ipcRenderer } from 'electron';

import config from '../config';

export const restart = () => {
  process.type === 'browser' ? restartInternal() : ipcRenderer.send('restart');
};

export const setupAppControls = () => {
  ipcMain.on('restart', restart);
  ipcMain.handle('getDownloadsFolder', () => app.getPath('downloads'));
  ipcMain.on('reload', () => BrowserWindow.getFocusedWindow()?.webContents.loadURL(config.get('url')));
  ipcMain.handle('getPath', (_, ...args: string[]) => path.join(...args));
};

function restartInternal() {
  app.relaunch({ execPath: process.env.PORTABLE_EXECUTABLE_FILE });
  // ExecPath will be undefined if not running portable app, resulting in default behavior
  app.quit();
}

function sendToFrontInternal(channel: string, ...args: unknown[]) {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, ...args);
  }
}

export const sendToFront
  = process.type === 'browser'
  ? sendToFrontInternal
  : () => {
    console.error('sendToFront called from renderer');
  };
