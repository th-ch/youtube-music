import path from 'node:path';

import { BrowserWindow } from 'electron';

import { injectCSS } from '../utils';

import type { ConfigType } from '../../config/dynamic';

export default (win: BrowserWindow, options: ConfigType<'video-toggle'>) => {
  if (options.forceHide) {
    injectCSS(win.webContents, path.join(__dirname, 'force-hide.css'));
  } else if (!options.mode || options.mode === 'custom') {
    injectCSS(win.webContents, path.join(__dirname, 'button-switcher.css'));
  }
};
