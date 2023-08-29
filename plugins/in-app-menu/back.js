const path = require('node:path');

const electronLocalshortcut = require('electron-localshortcut');
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main');

const { injectCSS } = require('../utils');

setupTitlebar();

// Tracks menu visibility

module.exports = (win) => {
  // Css for custom scrollbar + disable drag area(was causing bugs)
  injectCSS(win.webContents, path.join(__dirname, 'style.css'));

  win.once('ready-to-show', () => {
    attachTitlebarToWindow(win);

    electronLocalshortcut.register(win, '`', () => {
      win.webContents.send('toggleMenu');
    });
  });
};
