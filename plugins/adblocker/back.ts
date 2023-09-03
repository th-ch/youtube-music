import { BrowserWindow } from 'electron';

import { loadAdBlockerEngine } from './blocker';
import config from './config';

import type { ConfigType } from '../../config/dynamic';

type AdBlockOptions = ConfigType<'adblocker'>;

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
