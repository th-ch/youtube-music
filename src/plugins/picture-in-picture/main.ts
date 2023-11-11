import { app, BrowserWindow, ipcMain } from 'electron';

import style from './style.css?inline';

import builder, { PictureInPicturePluginConfig } from './index';

import { injectCSS } from '../utils/main';

export default builder.createMain(({ getConfig, setConfig, send, handle }) => {
  let isInPiP = false;
  let originalPosition: number[];
  let originalSize: number[];
  let originalFullScreen: boolean;
  let originalMaximized: boolean;

  let win: BrowserWindow;

  let config: PictureInPicturePluginConfig;

  const pipPosition = () => (config.savePosition && config['pip-position']) || [10, 10];
  const pipSize = () => (config.saveSize && config['pip-size']) || [450, 275];

  const togglePiP = () => {
    isInPiP = !isInPiP;
    setConfig({ isInPiP });

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

      handle('before-input-event', blockShortcutsInPiP);

      win.setMaximizable(false);
      win.setFullScreenable(false);

      send('pip-toggle', true);

      app.dock?.hide();
      win.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
      });
      app.dock?.show();
      if (config.alwaysOnTop) {
        win.setAlwaysOnTop(true, 'screen-saver', 1);
      }
    } else {
      win.webContents.removeListener('before-input-event', blockShortcutsInPiP);
      win.setMaximizable(true);
      win.setFullScreenable(true);

      send('pip-toggle', false);

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

  return ({
    async onLoad(window) {
      config ??= await getConfig();
      win ??= window;
      setConfig({ isInPiP });
      injectCSS(win.webContents, style);
      ipcMain.on('picture-in-picture', () => {
        togglePiP();
      });

      window.on('move', () => {
        if (config.isInPiP && !config.useNativePiP) {
          setConfig({ 'pip-position': window.getPosition() as [number, number] });
        }
      });

      window.on('resize', () => {
        if (config.isInPiP && !config.useNativePiP) {
          setConfig({ 'pip-size': window.getSize() as [number, number] });
        }
      });
    },
    onConfigChange(newConfig) {
      config = newConfig;
    }
  });
});

