import path from 'node:path';

import { register } from 'electron-localshortcut';
// eslint-disable-next-line import/no-unresolved
import { attachTitlebarToWindow, setupTitlebar } from 'custom-electron-titlebar/main';

import { BrowserWindow } from 'electron';

import { injectCSS } from '../utils';


setupTitlebar();

// Tracks menu visibility

module.exports = (win: BrowserWindow) => {
  // Css for custom scrollbar + disable drag area(was causing bugs)
  injectCSS(win.webContents, path.join(__dirname, 'style.css'));

  win.once('ready-to-show', () => {
    attachTitlebarToWindow(win);

    register(win, '`', () => {
      win.webContents.send('toggleMenu');
    });
  });
};
