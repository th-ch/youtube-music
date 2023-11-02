import { BrowserWindow } from 'electron';

import forceHideStyle from './force-hide.css';
import buttonSwitcherStyle from './button-switcher.css';

import { injectCSS } from '../utils';

import type { ConfigType } from '../../config/dynamic';

export default (win: BrowserWindow, options: ConfigType<'video-toggle'>) => {
  if (options.forceHide) {
    injectCSS(win.webContents, forceHideStyle);
  } else if (!options.mode || options.mode === 'custom') {
    injectCSS(win.webContents, buttonSwitcherStyle);
  }
};
