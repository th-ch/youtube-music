import { BrowserWindow } from 'electron';

import emptyPlayerStyle from './empty-player.css';

import { injectCSS } from '../utils';

export default (win: BrowserWindow) => {
  injectCSS(win.webContents, emptyPlayerStyle);
};
