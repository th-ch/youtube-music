import {
  contextBridge,
  ipcRenderer,
  IpcRendererEvent,
  webFrame,
} from 'electron';
import is from 'electron-is';

import config from './config';

import {
  forceLoadPreloadPlugin,
  forceUnloadPreloadPlugin,
  loadAllPreloadPlugins,
} from './loader/preload';
import { loadI18n, setLanguage } from '@/i18n';
import { YTMD_INTERNALS_CONSTANT } from './utils/internals';

new MutationObserver(async (mutations, observer) => {
  for (const mutation of mutations) {
    if (!mutation.addedNodes) return;

    for (const node of mutation.addedNodes) {
      const script = node as HTMLScriptElement;
      if (
        script.tagName !== 'SCRIPT' ||
        !script?.src?.match(/music_polymer_inlined_html\.js/)
      )
        continue;

      const href = script.src;
      const nonce = script.getAttribute('nonce');

      // Remove the script, so it is not executed.
      script.remove();

      // Fetch the remote script, and apply patches to it.
      const code = await fetch(href).then((r) => r.text());
      const newScript = Object.assign(document.createElement('script'), {
        nonce,
        innerHTML: code.replace(
          /[$\w]+=function\(\){.{0,100}this\.providers=new Map;/,
          (m) =>
            m +
            `(globalThis.${YTMD_INTERNALS_CONSTANT} ??= []).container=this;`,
        ),
      });

      document.body.appendChild(newScript);

      observer.disconnect();
      return;
    }
  }
}).observe(document, {
  childList: true,
  subtree: true,
});

loadI18n().then(async () => {
  await setLanguage(config.get('options.language') ?? 'en');
  await loadAllPreloadPlugins();
});

ipcRenderer.on('plugin:unload', async (_, id: string) => {
  await forceUnloadPreloadPlugin(id);
});
ipcRenderer.on('plugin:enable', async (_, id: string) => {
  await forceLoadPreloadPlugin(id);
});

contextBridge.exposeInMainWorld('mainConfig', config);
contextBridge.exposeInMainWorld('electronIs', is);
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (
    channel: string,
    listener: (event: IpcRendererEvent, ...args: unknown[]) => void,
  ) => ipcRenderer.on(channel, listener),
  off: (channel: string, listener: (...args: unknown[]) => void) =>
    ipcRenderer.off(channel, listener),
  once: (
    channel: string,
    listener: (event: IpcRendererEvent, ...args: unknown[]) => void,
  ) => ipcRenderer.once(channel, listener),
  send: (channel: string, ...args: unknown[]) =>
    ipcRenderer.send(channel, ...args),
  removeListener: (channel: string, listener: (...args: unknown[]) => void) =>
    ipcRenderer.removeListener(channel, listener),
  removeAllListeners: (channel: string) =>
    ipcRenderer.removeAllListeners(channel),
  invoke: async (channel: string, ...args: unknown[]): Promise<unknown> =>
    ipcRenderer.invoke(channel, ...args),
  sendSync: (channel: string, ...args: unknown[]): unknown =>
    ipcRenderer.sendSync(channel, ...args),
  sendToHost: (channel: string, ...args: unknown[]) =>
    ipcRenderer.sendToHost(channel, ...args),
});
contextBridge.exposeInMainWorld('reload', () =>
  ipcRenderer.send('ytmd:reload'),
);
contextBridge.exposeInMainWorld(
  'ELECTRON_RENDERER_URL',
  process.env.ELECTRON_RENDERER_URL,
);

const [path, script] = ipcRenderer.sendSync('get-renderer-script') as [
  string | null,
  string,
];
let blocked = true;
if (path) {
  webFrame.executeJavaScriptInIsolatedWorld(
    0,
    [
      {
        code: script,
        url: path,
      },
    ],
    true,
    () => (blocked = false),
  );
} else {
  webFrame.executeJavaScript(script, true, () => (blocked = false));
}

// HACK: Wait for the script to be executed
while (blocked);
