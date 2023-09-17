import fs from 'node:fs';
import path from 'node:path';

import { ipcMain, ipcRenderer } from 'electron';

import { ValueOf } from '../utils/type-utils';

export const noopTrustedHtmlPolicy = () => window?.trustedTypes?.createPolicy('forceInner', {
  createHTML: (s: string): string => s,
}) ?? {
  createHTML: (s: string): string => s,
};

// Creates a DOM element from an HTML string
export const ElementFromHtml = (html: string): HTMLElement => {
  const template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = noopTrustedHtmlPolicy().createHTML(html) as unknown as string;

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

const cssToInject = new Map();
export const injectCSS = (webContents: Electron.WebContents, filepath: unknown, cb: (() => void) | undefined = undefined) => {
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
