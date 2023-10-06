import { join } from 'node:path';

import { BrowserWindow } from 'electron';

import { injectCSS } from '../utils';

export default (win: BrowserWindow) => {
  injectCSS(win.webContents, join(__dirname, 'style.css'));
};
