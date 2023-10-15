import fs from 'node:fs';
import path from 'node:path';

import { app, ipcMain, ipcRenderer } from 'electron';
import is from 'electron-is';

import { ValueOf } from '../utils/type-utils';
import defaultConfig from '../config/defaults';

export const getAssetsDirectoryLocation = () => path.resolve(__dirname, 'assets');

export const getMediaIconLocation = () =>
  app.isPackaged
    ? path.resolve(app.getPath('userData'), 'icons')
    : path.resolve(getAssetsDirectoryLocation(), 'media-icons-black');

export const mediaIcons = {
  play: '\u{1405}', // ᐅ
  pause: '\u{2016}', // ‖
  next: '\u{1433}', // ᐳ
  previous: '\u{1438}', // ᐸ
} as const;

export const saveMediaIcon = () => {
  for (const kind of Object.keys(mediaIcons)) {
    const destinationPath = path.join(getMediaIconLocation(), `${kind}.png`);
    if (fs.existsSync(destinationPath)) {
      continue;
    }

    const iconPath = path.resolve(path.resolve(getAssetsDirectoryLocation(), 'media-icons-black'), `${kind}.png`);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFile(iconPath, destinationPath, () => {});
  }
};

// Creates a DOM element from an HTML string
export const ElementFromHtml = (html: string): HTMLElement => {
  const template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;

  return template.content.firstElementChild as HTMLElement;
};

// Creates a DOM element from a HTML file
export const ElementFromFile = (filepath: fs.PathOrFileDescriptor) => ElementFromHtml(fs.readFileSync(filepath, 'utf8'));

export const templatePath = (pluginPath: string, name: string) => path.join(pluginPath, 'templates', name);

export const Actions = {
  NEXT: 'next',
  BACK: 'back',
};

export const triggerAction = <Parameters extends unknown[]>(channel: string, action: ValueOf<typeof Actions>, ...args: Parameters) => ipcRenderer.send(channel, action, ...args);

export const triggerActionSync = <Parameters extends unknown[]>(channel: string, action: ValueOf<typeof Actions>, ...args: Parameters): unknown => ipcRenderer.sendSync(channel, action, ...args);

export const listenAction = (channel: string, callback: (event: Electron.IpcMainEvent, action: string) => void) => ipcMain.on(channel, callback);

export const fileExists = (
  path: fs.PathLike,
  callbackIfExists: { (): void; (): void; (): void; },
  callbackIfError: (() => void) | undefined = undefined,
) => {
  fs.access(path, fs.constants.F_OK, (error) => {
    if (error) {
      callbackIfError?.();

      return;
    }

    callbackIfExists();
  });
};

const cssToInject = new Map<string, (() => void) | undefined>();
const cssToInjectFile = new Map<string, (() => void) | undefined>();
export const injectCSS = (webContents: Electron.WebContents, css: string, cb: (() => void) | undefined = undefined) => {
  if (cssToInject.size === 0 && cssToInjectFile.size === 0) {
    setupCssInjection(webContents);
  }

  cssToInject.set(css, cb);
};

export const injectCSSAsFile = (webContents: Electron.WebContents, filepath: string, cb: (() => void) | undefined = undefined) => {
  if (cssToInject.size === 0 && cssToInjectFile.size === 0) {
    setupCssInjection(webContents);
  }

  cssToInjectFile.set(filepath, cb);
};

const setupCssInjection = (webContents: Electron.WebContents) => {
  webContents.on('did-finish-load', () => {
    cssToInject.forEach(async (callback, css) => {
      await webContents.insertCSS(css);
      callback?.();
    });

    cssToInjectFile.forEach(async (callback, filepath) => {
      await webContents.insertCSS(fs.readFileSync(filepath, 'utf8'));
      callback?.();
    });
  });
};

export const getAvailablePluginNames = () => {
  return Object.keys(defaultConfig.plugins).filter((name) => {
    if (is.windows() && name === 'touchbar') {
      return false;
    } else if (is.macOS() && name === 'taskbar-mediacontrol') {
      return false;
    } else if (is.linux() && (name === 'taskbar-mediacontrol' || name === 'touchbar')) {
      return false;
    }
    return true;
  });
};
