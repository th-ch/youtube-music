import { BrowserWindow } from 'electron';

import { loadAdBlockerEngine } from './blocker';
import { shouldUseBlocklists } from './config';

import type { ConfigType } from '../../config/dynamic';

type AdBlockOptions = ConfigType<'adblocker'>;

export default (win: BrowserWindow, options: AdBlockOptions) => {
  if (shouldUseBlocklists()) {
    loadAdBlockerEngine(
      win.webContents.session,
      options.cache,
      options.additionalBlockLists,
      options.disableDefaultLists,
    );
  }
};
