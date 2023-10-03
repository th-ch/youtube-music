import path from 'node:path';

import { BrowserWindow } from 'electron';

import { injectCSS } from '../utils';

export function handle(win: BrowserWindow) {
  injectCSS(win.webContents, path.join(__dirname, 'style.css'), () => {
    win.webContents.send('navigation-css-ready');
  });
}

export default handle;
