import fs from 'node:fs';

type Unregister = () => void;

let isLoaded = false;

const cssToInject = new Map<
  string,
  ((unregister: Unregister) => void) | undefined
>();
const cssToInjectFile = new Map<
  string,
  ((unregister: Unregister) => void) | undefined
>();
export const injectCSS = async (
  webContents: Electron.WebContents,
  css: string,
): Promise<Unregister> => {
  if (isLoaded) {
    const key = await webContents.insertCSS(css);
    return async () => await webContents.removeInsertedCSS(key);
  }

  return new Promise((resolve) => {
    if (cssToInject.size === 0 && cssToInjectFile.size === 0) {
      setupCssInjection(webContents);
    }
    cssToInject.set(css, resolve);
  });
};

export const injectCSSAsFile = async (
  webContents: Electron.WebContents,
  filepath: string,
): Promise<Unregister> => {
  if (isLoaded) {
    const key = await webContents.insertCSS(fs.readFileSync(filepath, 'utf-8'));
    return async () => await webContents.removeInsertedCSS(key);
  }

  return new Promise((resolve) => {
    if (cssToInject.size === 0 && cssToInjectFile.size === 0) {
      setupCssInjection(webContents);
    }

    cssToInjectFile.set(filepath, resolve);
  });
};

const setupCssInjection = (webContents: Electron.WebContents) => {
  webContents.on('did-finish-load', () => {
    isLoaded = true;

    cssToInject.forEach(async (callback, css) => {
      const key = await webContents.insertCSS(css);
      const remove = async () => await webContents.removeInsertedCSS(key);

      callback?.(remove);
    });

    cssToInjectFile.forEach(async (callback, filepath) => {
      const key = await webContents.insertCSS(
        fs.readFileSync(filepath, 'utf-8'),
      );
      const remove = async () => await webContents.removeInsertedCSS(key);

      callback?.(remove);
    });
  });
};
