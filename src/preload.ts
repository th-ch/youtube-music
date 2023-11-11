import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import is from 'electron-is';

import { pluginBuilders } from 'virtual:PluginBuilders';
import { preloadPlugins } from 'virtual:PreloadPlugins';

import config from './config';

import {
  PluginBaseConfig,
  PluginBuilder,
  PreloadPluginFactory
} from './plugins/utils/builder';
import {
  forceLoadPreloadPlugin,
  forceUnloadPreloadPlugin,
  loadAllPreloadPlugins,
  registerPreloadPlugin
} from './loader/preload';

Object.entries(pluginBuilders).forEach(([id, builder]) => {
  const typedBuilder = builder as PluginBuilder<string, PluginBaseConfig>;
  const plugin = preloadPlugins[id] as PreloadPluginFactory<PluginBaseConfig> | undefined;

  registerPreloadPlugin(id, typedBuilder, plugin);
});
loadAllPreloadPlugins();

ipcRenderer.on('plugin:unload', (_, id: keyof PluginBuilderList) => {
  forceUnloadPreloadPlugin(id);
});
ipcRenderer.on('plugin:enable', (_, id: keyof PluginBuilderList) => {
  forceLoadPreloadPlugin(id);
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
