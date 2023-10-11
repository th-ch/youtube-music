import path from 'node:path';

import { BrowserWindow, app, screen, globalShortcut, session, shell, dialog, ipcMain } from 'electron';
import enhanceWebRequest, { BetterSession } from '@jellybrick/electron-better-web-request';
import is from 'electron-is';
import unhandled from 'electron-unhandled';
import { autoUpdater } from 'electron-updater';
import electronDebug from 'electron-debug';

import config from './config';
import { refreshMenu, setApplicationMenu } from './menu';
import { fileExists, injectCSS, injectCSSAsFile } from './plugins/utils';
import { isTesting } from './utils/testing';
import { setUpTray } from './tray';
import { setupSongInfo } from './providers/song-info';
import { restart, setupAppControls } from './providers/app-controls';
import { APP_PROTOCOL, handleProtocol, setupProtocolHandler } from './providers/protocol-handler';

import adblocker from './plugins/adblocker/back';
import albumColorTheme from './plugins/album-color-theme/back';
import ambientMode from './plugins/ambient-mode/back';
import blurNavigationBar from './plugins/blur-nav-bar/back';
import captionsSelector from './plugins/captions-selector/back';
import crossfade from './plugins/crossfade/back';
import discord from './plugins/discord/back';
import downloader from './plugins/downloader/back';
import inAppMenu from './plugins/in-app-menu/back';
import lastFm from './plugins/last-fm/back';
import lumiaStream from './plugins/lumiastream/back';
import lyricsGenius from './plugins/lyrics-genius/back';
import navigation from './plugins/navigation/back';
import noGoogleLogin from './plugins/no-google-login/back';
import notifications from './plugins/notifications/back';
import pictureInPicture, { setOptions as pipSetOptions } from './plugins/picture-in-picture/back';
import preciseVolume from './plugins/precise-volume/back';
import qualityChanger from './plugins/quality-changer/back';
import shortcuts from './plugins/shortcuts/back';
import sponsorBlock from './plugins/sponsorblock/back';
import taskbarMediaControl from './plugins/taskbar-mediacontrol/back';
import touchbar from './plugins/touchbar/back';
import tunaObs from './plugins/tuna-obs/back';
import videoToggle from './plugins/video-toggle/back';
import visualizer from './plugins/visualizer/back';

import youtubeMusicCSS from './youtube-music.css';

// Catch errors and log them
unhandled({
  logger: console.error,
  showDialog: false,
});

// Disable Node options if the env var is set
process.env.NODE_OPTIONS = '';

// Prevent window being garbage collected
let mainWindow: Electron.BrowserWindow | null;
autoUpdater.autoDownload = false;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.exit();
}

// SharedArrayBuffer: Required for downloader (@ffmpeg/core-mt)
// OverlayScrollbar: Required for overlay scrollbars
app.commandLine.appendSwitch('enable-features', 'OverlayScrollbar,SharedArrayBuffer');
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

const mainPlugins = {
  'adblocker': adblocker,
  'album-color-theme': albumColorTheme,
  'ambient-mode': ambientMode,
  'blur-nav-bar': blurNavigationBar,
  'captions-selector': captionsSelector,
  'crossfade': crossfade,
  'discord': discord,
  'downloader': downloader,
  'in-app-menu': inAppMenu,
  'last-fm': lastFm,
  'lumiastream': lumiaStream,
  'lyrics-genius': lyricsGenius,
  'navigation': navigation,
  'no-google-login': noGoogleLogin,
  'notifications': notifications,
  'picture-in-picture': pictureInPicture,
  'precise-volume': preciseVolume,
  'quality-changer': qualityChanger,
  'shortcuts': shortcuts,
  'sponsorblock': sponsorBlock,
  'taskbar-mediacontrol': undefined as typeof taskbarMediaControl | undefined,
  'touchbar': undefined as typeof touchbar | undefined,
  'tuna-obs': tunaObs,
  'video-toggle': videoToggle,
  'visualizer': visualizer,
};
export const mainPluginNames = Object.keys(mainPlugins);

if (is.windows()) {
  mainPlugins['taskbar-mediacontrol'] = taskbarMediaControl;
  delete mainPlugins['touchbar'];
} else if (is.macOS()) {
  mainPlugins['touchbar'] = touchbar;
  delete mainPlugins['taskbar-mediacontrol'];
} else {
  delete mainPlugins['touchbar'];
  delete mainPlugins['taskbar-mediacontrol'];
}

ipcMain.handle('get-main-plugin-names', () => Object.keys(mainPlugins));

async function loadPlugins(win: BrowserWindow) {
  injectCSS(win.webContents, youtubeMusicCSS);
  // Load user CSS
  const themes: string[] = config.get('options.themes');
  if (Array.isArray(themes)) {
    for (const cssFile of themes) {
      fileExists(
        cssFile,
        () => {
          injectCSSAsFile(win.webContents, cssFile);
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
    try {
      if (Object.hasOwn(mainPlugins, plugin)) {
        console.log('Loaded plugin - ' + plugin);
        const handler = mainPlugins[plugin as keyof typeof mainPlugins];
        if (handler) {
          await handler(win, options as never);
        }
      }
    } catch (e) {
      console.error(`Failed to load plugin "${plugin}"`, e);
    }
  }
}

async function createMainWindow() {
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
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#ffffff',
      height: 36,
    },
    titleBarStyle: useInlineMenu
      ? 'hidden'
      : (is.macOS()
        ? 'hiddenInset'
        : 'default'),
    autoHideMenuBar: config.get('options.hideMenu'),
  });
  await loadPlugins(win);

  if (windowPosition) {
    const { x: windowX, y: windowY } = windowPosition;
    const winSize = win.getSize();
    const displaySize
      = screen.getDisplayNearestPoint(windowPosition).bounds;
    if (
      windowX + winSize[0] < displaySize.x - 8
      || windowX - winSize[0] > displaySize.x + displaySize.width
      || windowY < displaySize.y - 8
      || windowY > displaySize.y + displaySize.height
    ) {
      // Window is offscreen
      if (is.dev()) {
        console.log(
          `Window tried to render offscreen, windowSize=${String(winSize)}, displaySize=${String(displaySize)}, position=${String(windowPosition)}`,
        );
      }
    } else {
      win.setPosition(windowX, windowY);
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
  win.on('closed', onClosed);

  type PiPOptions = typeof config.defaultConfig.plugins['picture-in-picture'];
  const setPiPOptions = config.plugins.isEnabled('picture-in-picture')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ? (key: string, value: unknown) => pipSetOptions({ [key]: value })
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

  win.webContents.loadURL(urlToLoad);

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

    if (errorCode !== -3) { // -3 is a false positive
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
  globalShortcut.unregisterAll();
});

app.on('activate', async () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    mainWindow = await createMainWindow();
  } else if (!mainWindow.isVisible()) {
    mainWindow.show();
  }
});

app.on('ready', async () => {
  if (config.get('options.autoResetAppCache')) {
    // Clear cache after 20s
    const clearCacheTimeout = setTimeout(() => {
      if (is.dev()) {
        console.log('Clearing app cache.');
      }

      session.defaultSession.clearCache();
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
        const shortcutDetails = shell.readShortcutLink(shortcutPath); // Throw error if doesn't exist yet
        if (
          shortcutDetails.target !== appLocation
          || shortcutDetails.appUserModelId !== appID
        ) {
          throw 'needUpdate';
        }
      } catch (error) { // If not valid -> Register shortcut
        shell.writeShortcutLink(
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

  mainWindow = await createMainWindow();
  setApplicationMenu(mainWindow);
  refreshMenu(mainWindow);
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
      dialog.showMessageBox(dialogOptions).then((dialogOutput) => {
        switch (dialogOutput.response) {
          // Download
          case 1: {
            shell.openExternal(downloadLink);
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
    dialog.showMessageBox(mainWindow, {
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

  dialog.showMessageBox(win, {
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

function removeContentSecurityPolicy(
  betterSession: BetterSession = session.defaultSession as BetterSession,
) {
  // Allows defining multiple "onHeadersReceived" listeners
  // by enhancing the session.
  // Some plugins (e.g. adblocker) also define a "onHeadersReceived" listener
  enhanceWebRequest(betterSession);

  // Custom listener to tweak the content security policy
  betterSession.webRequest.onHeadersReceived((details, callback) => {
    details.responseHeaders ??= {};

    // Remove the content security policy
    delete details.responseHeaders['content-security-policy-report-only'];
    delete details.responseHeaders['content-security-policy'];

    callback({ cancel: false, responseHeaders: details.responseHeaders });
  });

  // When multiple listeners are defined, apply them all
  betterSession.webRequest.setResolver('onHeadersReceived', async (listeners) => {
    return listeners.reduce(
      async (accumulator, listener) => {
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
