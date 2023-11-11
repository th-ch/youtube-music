import { BrowserWindow } from 'electron';

import style from './style.css?inline';

import { injectCSS } from '../utils/main';

export default (win: BrowserWindow) => {
  injectCSS(win.webContents, style);
};
