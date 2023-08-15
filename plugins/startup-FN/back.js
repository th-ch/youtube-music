const { globalShortcut, ipcMain, app } = require('electron');

module.exports = win => {
  const registerMediaKeyShortcuts = () => {
    const mediaKeysActivated = globalShortcut.register('MediaPlayPause', () => {
      win.webContents.send('playPause');
    });

    const mediaKeysNextTrack = globalShortcut.register('MediaNextTrack', () => {
      win.webContents.send('nextTrack');
    });

    const mediaKeysPreviousTrack = globalShortcut.register('MediaPreviousTrack', () => {
      win.webContents.send('previousTrack');
    });

    if (!mediaKeysActivated || !mediaKeysNextTrack || !mediaKeysPreviousTrack) {
      console.log('Failed to register media key shortcuts');
    }
  };

  ipcMain.on('mediaKeysActivated', () => {
    registerMediaKeyShortcuts();

    win.on('closed', () => {
      globalShortcut.unregisterAll();
    });
  });

  app.on('browser-window-blur', () => {
    globalShortcut.unregisterAll();
  });

  app.on('browser-window-focus', () => {
    registerMediaKeyShortcuts();
  });
};
