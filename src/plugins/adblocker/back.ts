import { BrowserWindow } from 'electron';

import { loadAdBlockerEngine } from './blocker';
import { shouldUseBlocklists } from './config';

import type { ConfigType } from '../../config/dynamic';

type AdBlockOptions = ConfigType<'adblocker'>;

export default async (win: BrowserWindow, options: AdBlockOptions) => {
  if (shouldUseBlocklists()) {
    await loadAdBlockerEngine(
      win.webContents.session,
      options.cache,
      options.additionalBlockLists,
      options.disableDefaultLists,
    );
  }
};
