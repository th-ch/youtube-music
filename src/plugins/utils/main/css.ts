import fs from 'node:fs';

type Unregister = () => void;

const cssToInject = new Map<string, ((unregister: Unregister) => void) | undefined>();
const cssToInjectFile = new Map<string, ((unregister: Unregister) => void) | undefined>();
export const injectCSS = (webContents: Electron.WebContents, css: string): Promise<Unregister> => {
  return new Promise((resolve) => {
    if (cssToInject.size === 0 && cssToInjectFile.size === 0) {
      setupCssInjection(webContents);
    }
    cssToInject.set(css, resolve);
  });
};

export const injectCSSAsFile = (webContents: Electron.WebContents, filepath: string): Promise<Unregister> => {
  return new Promise((resolve) => {
    if (cssToInject.size === 0 && cssToInjectFile.size === 0) {
      setupCssInjection(webContents);
    }

    cssToInjectFile.set(filepath, resolve);
  });
};

const setupCssInjection = (webContents: Electron.WebContents) => {
  webContents.on('did-finish-load', () => {
    cssToInject.forEach(async (callback, css) => {
      const key = await webContents.insertCSS(css);
      const remove = async () => await webContents.removeInsertedCSS(key);

      callback?.(remove);
    });

    cssToInjectFile.forEach(async (callback, filepath) => {
      const key = await webContents.insertCSS(fs.readFileSync(filepath, 'utf-8'));
      const remove = async () => await webContents.removeInsertedCSS(key);

      callback?.(remove);
    });
  });
};
