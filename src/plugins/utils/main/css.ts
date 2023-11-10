import fs from 'node:fs';

const cssToInject = new Map<string, (() => void) | undefined>();
const cssToInjectFile = new Map<string, (() => void) | undefined>();
export const injectCSS = (webContents: Electron.WebContents, css: string, cb: (() => void) | undefined = undefined) => {
  if (cssToInject.size === 0 && cssToInjectFile.size === 0) {
    setupCssInjection(webContents);
  }

  console.log('injectCSS', css);
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
      await webContents.insertCSS(fs.readFileSync(filepath, 'utf-8'));
      callback?.();
    });
  });
};
