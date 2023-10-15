import { BrowserWindow } from 'electron';

import style from './style.css';

import { injectCSS } from '../utils';

export default (win: BrowserWindow) => {
  injectCSS(win.webContents, style);
};
