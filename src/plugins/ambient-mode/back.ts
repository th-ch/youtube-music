import { BrowserWindow } from 'electron';

import config from './config';
import style from './style.css';

import { injectCSS } from '../utils';

export default (win: BrowserWindow) => {
  config.subscribeAll((newConfig) => {
    win.webContents.send('ambient-mode:config-change', newConfig);
  });

  injectCSS(win.webContents, style);
};
