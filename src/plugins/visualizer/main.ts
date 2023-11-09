import { BrowserWindow } from 'electron';

import emptyPlayerStyle from './empty-player.css';

import { injectCSS } from '../utils/main';

export default (win: BrowserWindow) => {
  injectCSS(win.webContents, emptyPlayerStyle);
};
