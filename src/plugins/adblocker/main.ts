import { BrowserWindow } from 'electron';

import { isBlockerEnabled, loadAdBlockerEngine, unloadAdBlockerEngine } from './blocker';

import builder from './index';
import { blockers } from './types';

export default builder.createMain(({ getConfig }) => {
  let mainWindow: BrowserWindow | undefined;

  return {
    async onLoad(window) {
      const config = await getConfig();
      mainWindow = window;

      if (config.blocker === blockers.WithBlocklists) {
        await loadAdBlockerEngine(
          window.webContents.session,
          config.cache,
          config.additionalBlockLists,
          config.disableDefaultLists,
        );
      }
    },
    onUnload(window) {
      if (isBlockerEnabled(window.webContents.session)) {
        unloadAdBlockerEngine(window.webContents.session);
      }
    },
    async onConfigChange(newConfig) {
      if (mainWindow) {
        if (newConfig.blocker === blockers.WithBlocklists && !isBlockerEnabled(mainWindow.webContents.session)) {
          await loadAdBlockerEngine(
            mainWindow.webContents.session,
            newConfig.cache,
            newConfig.additionalBlockLists,
            newConfig.disableDefaultLists,
          );
        }
      }
    }
  };
});
