import path from 'node:path';

import { app, BrowserWindow, ipcMain } from 'electron';

import { setOptions as setPluginOptions } from '../../config/plugins';
import { injectCSS } from '../utils';

import config from '../../config';

let isInPiP = false;
let originalPosition: number[];
let originalSize: number[];
let originalFullScreen: boolean;
let originalMaximized: boolean;

let win: BrowserWindow;

// Magic of TypeScript
const PiPOptionsObj = config.get('plugins.picture-in-picture');
type PiPOptions = typeof PiPOptionsObj;

let options: Partial<PiPOptions>;

const pipPosition = () => (options.savePosition && options['pip-position']) || [10, 10];
const pipSize = () => (options.saveSize && options['pip-size']) || [450, 275];

const setLocalOptions = (_options: Partial<PiPOptions>) => {
  options = { ...options, ..._options };
  setPluginOptions('picture-in-picture', _options);
};

const togglePiP = () => {
  isInPiP = !isInPiP;
  setLocalOptions({ isInPiP });

  if (isInPiP) {
    originalFullScreen = win.isFullScreen();
    if (originalFullScreen) {
      win.setFullScreen(false);
    }

    originalMaximized = win.isMaximized();
    if (originalMaximized) {
      win.unmaximize();
    }

    originalPosition = win.getPosition();
    originalSize = win.getSize();

    win.webContents.on('before-input-event', blockShortcutsInPiP);

    win.setMaximizable(false);
    win.setFullScreenable(false);

    win.webContents.send('pip-toggle', true);

    app.dock?.hide();
    win.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });
    app.dock?.show();
    if (options.alwaysOnTop) {
      win.setAlwaysOnTop(true, 'screen-saver', 1);
    }
  } else {
    win.webContents.removeListener('before-input-event', blockShortcutsInPiP);
    win.setMaximizable(true);
    win.setFullScreenable(true);

    win.webContents.send('pip-toggle', false);

    win.setVisibleOnAllWorkspaces(false);
    win.setAlwaysOnTop(false);

    if (originalFullScreen) {
      win.setFullScreen(true);
    }

    if (originalMaximized) {
      win.maximize();
    }
  }

  const [x, y] = isInPiP ? pipPosition() : originalPosition;
  const [w, h] = isInPiP ? pipSize() : originalSize;
  win.setPosition(x, y);
  win.setSize(w, h);

  win.setWindowButtonVisibility?.(!isInPiP);
};

const blockShortcutsInPiP = (event: Electron.Event, input: Electron.Input) => {
  const key = input.key.toLowerCase();

  if (key === 'f') {
    event.preventDefault();
  } else if (key === 'escape') {
    togglePiP();
    event.preventDefault();
  }
};

export default (_win: BrowserWindow, _options: PiPOptions) => {
  options ??= _options;
  win ??= _win;
  setLocalOptions({ isInPiP });
  injectCSS(win.webContents, path.join(__dirname, 'style.css'));
  ipcMain.on('picture-in-picture', () => {
    togglePiP();
  });
};

export const setOptions = setLocalOptions;
