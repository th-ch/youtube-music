import { BrowserWindow, globalShortcut } from 'electron';
import is from 'electron-is';
import electronLocalshortcut from 'electron-localshortcut';

import registerMPRIS from './mpris';

import getSongControls from '../../providers/song-controls';

import type { ConfigType } from '../../config/dynamic';

function _registerGlobalShortcut(webContents: Electron.WebContents, shortcut: string, action: (webContents: Electron.WebContents) => void) {
  globalShortcut.register(shortcut, () => {
    action(webContents);
  });
}

function _registerLocalShortcut(win: BrowserWindow, shortcut: string, action: (webContents: Electron.WebContents) => void) {
  electronLocalshortcut.register(win, shortcut, () => {
    action(win.webContents);
  });
}

function registerShortcuts(win: BrowserWindow, options: ConfigType<'shortcuts'>) {
  const songControls = getSongControls(win);
  const { playPause, next, previous, search } = songControls;

  if (options.overrideMediaKeys) {
    _registerGlobalShortcut(win.webContents, 'MediaPlayPause', playPause);
    _registerGlobalShortcut(win.webContents, 'MediaNextTrack', next);
    _registerGlobalShortcut(win.webContents, 'MediaPreviousTrack', previous);
  }

  _registerLocalShortcut(win, 'CommandOrControl+F', search);
  _registerLocalShortcut(win, 'CommandOrControl+L', search);

  if (is.linux()) {
    registerMPRIS(win);
  }

  const { global, local } = options;
  const shortcutOptions = { global, local };

  for (const optionType in shortcutOptions) {
    registerAllShortcuts(shortcutOptions[optionType as 'global' | 'local'], optionType);
  }

  function registerAllShortcuts(container: Record<string, string>, type: string) {
    for (const action in container) {
      if (!container[action]) {
        continue; // Action accelerator is empty
      }

      console.debug(`Registering ${type} shortcut`, container[action], ':', action);
      const actionCallback: () => void = songControls[action as keyof typeof songControls];
      if (typeof actionCallback !== 'function') {
        console.warn('Invalid action', action);
        continue;
      }

      if (type === 'global') {
        _registerGlobalShortcut(win.webContents, container[action], actionCallback);
      } else { // Type === "local"
        _registerLocalShortcut(win, local[action], actionCallback);
      }
    }
  }
}

export default registerShortcuts;
