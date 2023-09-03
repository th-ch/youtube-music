import path from 'node:path';

import { BrowserWindow } from 'electron';

import { injectCSS } from '../utils';

export default (win: BrowserWindow) => {
  injectCSS(win.webContents, path.join(__dirname, 'empty-player.css'));
};
