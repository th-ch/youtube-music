import fs from 'node:fs';
import path from 'node:path';

import { ipcMain, ipcRenderer } from 'electron';

import { ValueOf } from '../utils/type-utils';


// Creates a DOM element from an HTML string
export const ElementFromHtml = (html: string) => {
  const template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
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

export const listenAction = (channel: string, callback: <Parameters extends unknown[]>(event: Electron.IpcMainEvent, ...args: Parameters) => void) => ipcMain.on(channel, callback);

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

const cssToInject = new Map();
export const injectCSS = (webContents: Electron.WebContents, filepath: unknown, cb = undefined) => {
  if (cssToInject.size === 0) {
    setupCssInjection(webContents);
  }

  cssToInject.set(filepath, cb);
};

const setupCssInjection = (webContents: Electron.WebContents) => {
  webContents.on('did-finish-load', () => {
    cssToInject.forEach(async (callback: () => void | undefined, filepath: fs.PathOrFileDescriptor) => {
      await webContents.insertCSS(fs.readFileSync(filepath, 'utf8'));
      callback?.();
    });
  });
};

export const getAllPlugins = () => {
  const isDirectory = (source: fs.PathLike) => fs.lstatSync(source).isDirectory();
  return fs
    .readdirSync(__dirname)
    .map((name) => path.join(__dirname, name))
    .filter(isDirectory)
    .map((name) => path.basename(name));
};
