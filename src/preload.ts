import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import is from 'electron-is';

import "../env.d.ts";
import config from './config';

const enabledPluginNameAndOptions = config.plugins.getEnabled();

enabledPluginNameAndOptions.forEach(async ([plugin, options]) => {
  if (Object.hasOwn(preloadPlugins, plugin)) {
    const handler = preloadPlugins[plugin];
    try {
      await handler?.();
    } catch (error) {
      console.error(`Error in plugin "${plugin}": ${String(error)}`);
    }
  }
});

contextBridge.exposeInMainWorld('mainConfig', config);
contextBridge.exposeInMainWorld('electronIs', is);
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) => ipcRenderer.on(channel, listener),
  off: (channel: string, listener: (...args: unknown[]) => void) => ipcRenderer.off(channel, listener),
  once: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) => ipcRenderer.once(channel, listener),
  send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
  removeListener: (channel: string, listener: (...args: unknown[]) => void) => ipcRenderer.removeListener(channel, listener),
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
  invoke: async (channel: string, ...args: unknown[]): Promise<unknown> => ipcRenderer.invoke(channel, ...args),
  sendSync: (channel: string, ...args: unknown[]): unknown => ipcRenderer.sendSync(channel, ...args),
  sendToHost: (channel: string, ...args: unknown[]) => ipcRenderer.sendToHost(channel, ...args),
});
contextBridge.exposeInMainWorld('reload', () => ipcRenderer.send('reload'));
contextBridge.exposeInMainWorld('ELECTRON_RENDERER_URL', process.env.ELECTRON_RENDERER_URL);
