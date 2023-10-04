import { BrowserWindow } from 'electron';

import style from './style.css';

import { injectCSS } from '../utils';

export function handle(win: BrowserWindow) {
  injectCSS(win.webContents, style, () => {
    win.webContents.send('navigation-css-ready');
  });
}

export default handle;
