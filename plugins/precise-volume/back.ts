import { globalShortcut, BrowserWindow } from 'electron';

import volumeHudStyle from './volume-hud.css';

import { injectCSS } from '../utils';

import type { ConfigType } from '../../config/dynamic';

/*
This is used to determine if plugin is actually active
(not if it's only enabled in options)
*/
let isEnabled = false;

export const enabled = () => isEnabled;

export default (win: BrowserWindow, options: ConfigType<'precise-volume'>) => {
  isEnabled = true;
  injectCSS(win.webContents, volumeHudStyle);

  if (options.globalShortcuts?.volumeUp) {
    globalShortcut.register((options.globalShortcuts.volumeUp), () => win.webContents.send('changeVolume', true));
  }

  if (options.globalShortcuts?.volumeDown) {
    globalShortcut.register((options.globalShortcuts.volumeDown), () => win.webContents.send('changeVolume', false));
  }
};
