import { BrowserWindow } from 'electron';

import { loadAdBlockerEngine } from './blocker';
import config from './config';

import pluginConfig from '../../config';

const AdBlockOptionsObj = pluginConfig.get('plugins.adblocker');
type AdBlockOptions = typeof AdBlockOptionsObj;

export default async (win: BrowserWindow, options: AdBlockOptions) => {
  if (await config.shouldUseBlocklists()) {
    loadAdBlockerEngine(
      win.webContents.session,
      options.cache,
      options.additionalBlockLists,
      options.disableDefaultLists,
    );
  }
};
