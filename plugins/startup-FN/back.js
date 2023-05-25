// back.js
const { globalShortcut, ipcMain } = require('electron');

module.exports = win => {
  ipcMain.on('mediaKeysActivated', () => {
    const registerMediaKeyShortcuts = () => {
      globalShortcut.register('MediaPlayPause', () => {
        win.webContents.send('playPause');
      });

      globalShortcut.register('MediaNextTrack', () => {
        win.webContents.send('nextTrack');
      });

      globalShortcut.register('MediaPreviousTrack', () => {
        win.webContents.send('previousTrack');
      });
    };

    // Registriere das Tastenkürzel für die Multimedia-Tasten
    registerMediaKeyShortcuts();

    // Entferne das Tastenkürzel, wenn das Fenster geschlossen wird
    win.on('closed', () => {
      globalShortcut.unregisterAll();
    });
  });
};
