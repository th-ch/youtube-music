import path from 'node:path';

import electron, { BrowserWindow } from 'electron';
import enhanceWebRequest from 'electron-better-web-request';
import is from 'electron-is';
import unhandled from 'electron-unhandled';
import { autoUpdater } from 'electron-updater';
import electronDebug from 'electron-debug';

import { BetterWebRequest } from 'electron-better-web-request/lib/electron-better-web-request';

import config from './config';
import { setApplicationMenu } from './menu';
import { fileExists, injectCSS } from './plugins/utils';
import { isTesting } from './utils/testing';
import { setUpTray } from './tray';
import { setupSongInfo } from './providers/song-info';
import { restart, setupAppControls } from './providers/app-controls';
import { APP_PROTOCOL, handleProtocol, setupProtocolHandler } from './providers/protocol-handler';


// Catch errors and log them
unhandled({
  logger: console.error,
  showDialog: false,
});

// Disable Node options if the env var is set
process.env.NODE_OPTIONS = '';

const { app } = electron;
// Prevent window being garbage collected
let mainWindow: Electron.BrowserWindow | null;
autoUpdater.autoDownload = false;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.exit();
}

app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer'); // Required for downloader
if (config.get('options.disableHardwareAcceleration')) {
  if (is.dev()) {
    console.log('Disabling hardware acceleration');
  }

  app.disableHardwareAcceleration();
}

if (is.linux() && config.plugins.isEnabled('shortcuts')) {
  // Stops chromium from launching its own MPRIS service
  app.commandLine.appendSwitch('disable-features', 'MediaSessionService');
}

if (config.get('options.proxy')) {
  app.commandLine.appendSwitch('proxy-server', config.get('options.proxy'));
}

// Adds debug features like hotkeys for triggering dev tools and reload
electronDebug({
  showDevTools: false, // Disable automatic devTools on new window
});

let icon = 'assets/youtube-music.png';
if (process.platform === 'win32') {
  icon = 'assets/generated/icon.ico';
} else if (process.platform === 'darwin') {
  icon = 'assets/generated/icon.icns';
}

function onClosed() {
  // Dereference the window
  // For multiple Windows store them in an array
  mainWindow = null;
}

function loadPlugins(win: BrowserWindow) {
  injectCSS(win.webContents, path.join(__dirname, 'youtube-music.css'));
  // Load user CSS
  const themes: string[] = config.get('options.themes');
  if (Array.isArray(themes)) {
    for (const cssFile of themes) {
      fileExists(
        cssFile,
        () => {
          injectCSS(win.webContents, cssFile);
        },
        () => {
          console.warn(`CSS file "${cssFile}" does not exist, ignoring`);
        },
      );
    }
  }

  win.webContents.once('did-finish-load', () => {
    if (is.dev()) {
      console.log('did finish load');
      win.webContents.openDevTools();
    }
  });

  for (const [plugin, options] of config.plugins.getEnabled()) {
    console.log('Loaded plugin - ' + plugin);
    const pluginPath = path.join(__dirname, 'plugins', plugin, 'back.js');
    fileExists(pluginPath, () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-member-access
      const handle = require(pluginPath).default as (window: BrowserWindow, option: typeof options) => void;
      handle(win, options);
    });
  }
}

function createMainWindow() {
  const windowSize = config.get('window-size');
  const windowMaximized = config.get('window-maximized');
  const windowPosition: Electron.Point = config.get('window-position');
  const useInlineMenu = config.plugins.isEnabled('in-app-menu');

  const win = new BrowserWindow({
    icon,
    width: windowSize.width,
    height: windowSize.height,
    backgroundColor: '#000',
    show: false,
    webPreferences: {
      // TODO: re-enable contextIsolation once it can work with FFMpeg.wasm
      // Possible bundling? https://github.com/ffmpegwasm/ffmpeg.wasm/issues/126
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegrationInSubFrames: true,
      ...(isTesting()
        ? undefined
        : {
          // Sandbox is only enabled in tests for now
          // See https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
          sandbox: false,
        }),
    },
    frame: !is.macOS() && !useInlineMenu,
    titleBarStyle: useInlineMenu
      ? 'hidden'
      : (is.macOS()
        ? 'hiddenInset'
        : 'default'),
    autoHideMenuBar: config.get('options.hideMenu'),
  });
  loadPlugins(win);

  if (windowPosition) {
    const { x, y } = windowPosition;
    const winSize = win.getSize();
    const displaySize
      = electron.screen.getDisplayNearestPoint(windowPosition).bounds;
    if (
      x + winSize[0] < displaySize.x - 8
      || x - winSize[0] > displaySize.x + displaySize.width
      || y < displaySize.y - 8
      || y > displaySize.y + displaySize.height
    ) {
      // Window is offscreen
      if (is.dev()) {
        console.log(
          `Window tried to render offscreen, windowSize=${String(winSize)}, displaySize=${String(displaySize)}, position=${String(windowPosition)}`,
        );
      }
    } else {
      win.setPosition(x, y);
    }
  }

  if (windowMaximized) {
    win.maximize();
  }

  if (config.get('options.alwaysOnTop')) {
    win.setAlwaysOnTop(true);
  }

  const urlToLoad = config.get('options.resumeOnStart')
    ? config.get('url')
    : config.defaultConfig.url;
  win.webContents.loadURL(urlToLoad);
  win.on('closed', onClosed);

  type PiPOptions = typeof config.defaultConfig.plugins['picture-in-picture'];
  const setPiPOptions = config.plugins.isEnabled('picture-in-picture')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ? (key: string, value: unknown) => (require('./plugins/picture-in-picture/back') as typeof import('./plugins/picture-in-picture/back'))
      .setOptions({ [key]: value })
    : () => {};

  win.on('move', () => {
    if (win.isMaximized()) {
      return;
    }

    const position = win.getPosition();
    const isPiPEnabled: boolean
      = config.plugins.isEnabled('picture-in-picture')
      && config.plugins.getOptions<PiPOptions>('picture-in-picture').isInPiP;
    if (!isPiPEnabled) {

      lateSave('window-position', { x: position[0], y: position[1] });
    } else if (config.plugins.getOptions<PiPOptions>('picture-in-picture').savePosition) {
      lateSave('pip-position', position, setPiPOptions);
    }
  });

  let winWasMaximized: boolean;

  win.on('resize', () => {
    const windowSize = win.getSize();
    const isMaximized = win.isMaximized();

    const isPiPEnabled
      = config.plugins.isEnabled('picture-in-picture')
      && config.plugins.getOptions<PiPOptions>('picture-in-picture').isInPiP;

    if (!isPiPEnabled && winWasMaximized !== isMaximized) {
      winWasMaximized = isMaximized;
      config.set('window-maximized', isMaximized);
    }

    if (isMaximized) {
      return;
    }

    if (!isPiPEnabled) {
      lateSave('window-size', {
        width: windowSize[0],
        height: windowSize[1],
      });
    } else if (config.plugins.getOptions<PiPOptions>('picture-in-picture').saveSize) {
      lateSave('pip-size', windowSize, setPiPOptions);
    }
  });

  const savedTimeouts: Record<string, NodeJS.Timeout | undefined> = {};

  function lateSave(key: string, value: unknown, fn: (key: string, value: unknown) => void = config.set) {
    if (savedTimeouts[key]) {
      clearTimeout(savedTimeouts[key]);
    }

    savedTimeouts[key] = setTimeout(() => {
      fn(key, value);
      savedTimeouts[key] = undefined;
    }, 600);
  }

  app.on('render-process-gone', (event, webContents, details) => {
    showUnresponsiveDialog(win, details);
  });

  win.once('ready-to-show', () => {
    if (config.get('options.appVisible')) {
      win.show();
    }
  });

  removeContentSecurityPolicy();

  return win;
}

app.once('browser-window-created', (event, win) => {
  if (config.get('options.overrideUserAgent')) {
    // User agents are from https://developers.whatismybrowser.com/useragents/explore/
    const originalUserAgent = win.webContents.userAgent;
    const userAgents = {
      mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12.1; rv:95.0) Gecko/20100101 Firefox/95.0',
      windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0',
      linux: 'Mozilla/5.0 (Linux x86_64; rv:95.0) Gecko/20100101 Firefox/95.0',
    };

    const updatedUserAgent
      = is.macOS() ? userAgents.mac
      : (is.windows() ? userAgents.windows
        : userAgents.linux);

    win.webContents.userAgent = updatedUserAgent;
    app.userAgentFallback = updatedUserAgent;

    win.webContents.session.webRequest.onBeforeSendHeaders((details, cb) => {
      // This will only happen if login failed, and "retry" was pressed
      if (win.webContents.getURL().startsWith('https://accounts.google.com') && details.url.startsWith('https://accounts.google.com')) {
        details.requestHeaders['User-Agent'] = originalUserAgent;
      }

      cb({ requestHeaders: details.requestHeaders });
    });
  }

  setupSongInfo(win);
  setupAppControls();

  win.webContents.on('did-fail-load', (
    _event,
    errorCode,
    errorDescription,
    validatedURL,
    isMainFrame,
    frameProcessId,
    frameRoutingId,
  ) => {
    const log = JSON.stringify({
      error: 'did-fail-load',
      errorCode,
      errorDescription,
      validatedURL,
      isMainFrame,
      frameProcessId,
      frameRoutingId,
    }, null, '\t');
    if (is.dev()) {
      console.log(log);
    }

    if (!(config.plugins.isEnabled('in-app-menu') && errorCode === -3)) { // -3 is a false positive with in-app-menu
      win.webContents.send('log', log);
      win.webContents.loadFile(path.join(__dirname, 'error.html'));
    }
  });

  win.webContents.on('will-prevent-unload', (event) => {
    event.preventDefault();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }

  // Unregister all shortcuts.
  electron.globalShortcut.unregisterAll();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  } else if (!mainWindow.isVisible()) {
    mainWindow.show();
  }
});

app.on('ready', () => {
  if (config.get('options.autoResetAppCache')) {
    // Clear cache after 20s
    const clearCacheTimeout = setTimeout(() => {
      if (is.dev()) {
        console.log('Clearing app cache.');
      }

      electron.session.defaultSession.clearCache();
      clearTimeout(clearCacheTimeout);
    }, 20_000);
  }

  // Register appID on windows
  if (is.windows()) {
    const appID = 'com.github.th-ch.youtube-music';
    app.setAppUserModelId(appID);
    const appLocation = process.execPath;
    const appData = app.getPath('appData');
    // Check shortcut validity if not in dev mode / running portable app
    if (!is.dev() && !appLocation.startsWith(path.join(appData, '..', 'Local', 'Temp'))) {
      const shortcutPath = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'YouTube Music.lnk');
      try { // Check if shortcut is registered and valid
        const shortcutDetails = electron.shell.readShortcutLink(shortcutPath); // Throw error if doesn't exist yet
        if (
          shortcutDetails.target !== appLocation
          || shortcutDetails.appUserModelId !== appID
        ) {
          throw 'needUpdate';
        }
      } catch (error) { // If not valid -> Register shortcut
        electron.shell.writeShortcutLink(
          shortcutPath,
          error === 'needUpdate' ? 'update' : 'create',
          {
            target: appLocation,
            cwd: path.dirname(appLocation),
            description: 'YouTube Music Desktop App - including custom plugins',
            appUserModelId: appID,
          },
        );
      }
    }
  }

  mainWindow = createMainWindow();
  setApplicationMenu(mainWindow);
  setUpTray(app, mainWindow);

  setupProtocolHandler(mainWindow);

  app.on('second-instance', (_, commandLine) => {
    const uri = `${APP_PROTOCOL}://`;
    const protocolArgv = commandLine.find((arg) => arg.startsWith(uri));
    if (protocolArgv) {
      const lastIndex = protocolArgv.endsWith('/') ? -1 : undefined;
      const command = protocolArgv.slice(uri.length, lastIndex);
      if (is.dev()) {
        console.debug(`Received command over protocol: "${command}"`);
      }

      handleProtocol(command);
      return;
    }

    if (!mainWindow) {
      return;
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }

    mainWindow.focus();
  });

  // Autostart at login
  app.setLoginItemSettings({
    openAtLogin: config.get('options.startAtLogin'),
  });

  if (!is.dev() && config.get('options.autoUpdates')) {
    const updateTimeout = setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
      clearTimeout(updateTimeout);
    }, 2000);
    autoUpdater.on('update-available', () => {
      const downloadLink
        = 'https://github.com/th-ch/youtube-music/releases/latest';
      const dialogOptions: Electron.MessageBoxOptions = {
        type: 'info',
        buttons: ['OK', 'Download', 'Disable updates'],
        title: 'Application Update',
        message: 'A new version is available',
        detail: `A new version is available and can be downloaded at ${downloadLink}`,
      };
      electron.dialog.showMessageBox(dialogOptions).then((dialogOutput) => {
        switch (dialogOutput.response) {
          // Download
          case 1: {
            electron.shell.openExternal(downloadLink);
            break;
          }

          // Disable updates
          case 2: {
            config.set('options.autoUpdates', false);
            break;
          }

          default: {
            break;
          }
        }
      });
    });
  }

  if (config.get('options.hideMenu') && !config.get('options.hideMenuWarned')) {
    electron.dialog.showMessageBox(mainWindow, {
      type: 'info', title: 'Hide Menu Enabled',
      message: "Menu is hidden, use 'Alt' to show it (or 'Escape' if using in-app-menu)",
    });
    config.set('options.hideMenuWarned', true);
  }

  // Optimized for Mac OS X
  if (is.macOS() && !config.get('options.appVisible')) {
    app.dock.hide();
  }

  let forceQuit = false;
  app.on('before-quit', () => {
    forceQuit = true;
  });

  if (is.macOS() || config.get('options.tray')) {
    mainWindow.on('close', (event) => {
      // Hide the window instead of quitting (quit is available in tray options)
      if (!forceQuit) {
        event.preventDefault();
        mainWindow!.hide();
      }
    });
  }
});

function showUnresponsiveDialog(win: BrowserWindow, details: Electron.RenderProcessGoneDetails) {
  if (details) {
    console.log('Unresponsive Error!\n' + JSON.stringify(details, null, '\t'));
  }

  electron.dialog.showMessageBox(win, {
    type: 'error',
    title: 'Window Unresponsive',
    message: 'The Application is Unresponsive',
    detail: 'We are sorry for the inconvenience! please choose what to do:',
    buttons: ['Wait', 'Relaunch', 'Quit'],
    cancelId: 0,
  }).then((result) => {
    switch (result.response) {
      case 1: {
        restart();
        break;
      }

      case 2: {
        app.quit();
        break;
      }
    }
  });
}

// HACK: electron-better-web-request's typing is wrong
type BetterSession = Omit<Electron.Session, 'webRequest'> & { webRequest: BetterWebRequest & Electron.WebRequest };
function removeContentSecurityPolicy(
  session: BetterSession = electron.session.defaultSession as BetterSession,
) {
  // Allows defining multiple "onHeadersReceived" listeners
  // by enhancing the session.
  // Some plugins (e.g. adblocker) also define a "onHeadersReceived" listener
  enhanceWebRequest(session);

  // Custom listener to tweak the content security policy
  session.webRequest.onHeadersReceived((details, callback) => {
    details.responseHeaders ??= {};

    // Remove the content security policy
    delete details.responseHeaders['content-security-policy-report-only'];
    delete details.responseHeaders['content-security-policy'];

    callback({ cancel: false, responseHeaders: details.responseHeaders });
  });

  type ResolverListener = { apply: () => Promise<Record<string, unknown>>; context: unknown };
  // When multiple listeners are defined, apply them all
  session.webRequest.setResolver('onHeadersReceived', async (listeners: ResolverListener[]) => {
    return listeners.reduce<Promise<Record<string, unknown>>>(
      async (accumulator: Promise<Record<string, unknown>>, listener: ResolverListener) => {
        const acc = await accumulator;
        if (acc.cancel) {
          return acc;
        }

        const result = await listener.apply();
        return { ...accumulator, ...result };
      },
      Promise.resolve({ cancel: false }),
    );
  });
}
