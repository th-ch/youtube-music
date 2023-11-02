import path from 'node:path';

import { Menu, nativeImage, Tray } from 'electron';

import { restart } from './providers/app-controls';
import config from './config';
import getSongControls from './providers/song-controls';

import { getAssetsDirectoryLocation } from './plugins/utils';

import type { MenuTemplate } from './menu';

// Prevent tray being garbage collected
let tray: Electron.Tray | undefined;

type TrayEvent = (event: Electron.KeyboardEvent, bounds: Electron.Rectangle) => void;

export const setTrayOnClick = (fn: TrayEvent) => {
  if (!tray) {
    return;
  }

  tray.removeAllListeners('click');
  tray.on('click', fn);
};

// Won't do anything on macOS since its disabled
export const setTrayOnDoubleClick = (fn: TrayEvent) => {
  if (!tray) {
    return;
  }

  tray.removeAllListeners('double-click');
  tray.on('double-click', fn);
};

export const setUpTray = (app: Electron.App, win: Electron.BrowserWindow) => {
  if (!config.get('options.tray')) {
    tray = undefined;
    return;
  }

  const { playPause, next, previous } = getSongControls(win);
  const iconPath = path.join(getAssetsDirectoryLocation(), 'youtube-music-tray.png');

  const trayIcon = nativeImage.createFromPath(iconPath).resize({
    width: 16,
    height: 16,
  });

  tray = new Tray(trayIcon);

  tray.setToolTip('YouTube Music');

  // MacOS only
  tray.setIgnoreDoubleClickEvents(true);

  tray.on('click', () => {
    if (config.get('options.trayClickPlayPause')) {
      playPause();
    } else if (win.isVisible()) {
      win.hide();
      app.dock?.hide();
    } else {
      win.show();
      app.dock?.show();
    }
  });

  const template: MenuTemplate = [
    {
      label: 'Play/Pause',
      click() {
        playPause();
      },
    },
    {
      label: 'Next',
      click() {
        next();
      },
    },
    {
      label: 'Previous',
      click() {
        previous();
      },
    },
    {
      label: 'Show',
      click() {
        win.show();
        app.dock?.show();
      },
    },
    {
      label: 'Restart App',
      click: restart,
    },
    { role: 'quit' },
  ];

  const trayMenu = Menu.buildFromTemplate(template);
  tray.setContextMenu(trayMenu);
};
