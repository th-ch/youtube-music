import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import is from 'electron-is';

import { pluginBuilders } from 'virtual:PluginBuilders';

import { deepmerge } from 'deepmerge-ts';

import config from './config';

// eslint-disable-next-line import/order
import { preloadPlugins } from 'virtual:PreloadPlugins';
import { PluginBaseConfig, PluginContext, PreloadPluginFactory } from './plugins/utils/builder';

const createContext = <
  Key extends keyof PluginBuilderList,
  Config extends PluginBaseConfig = PluginBuilderList[Key]['config'],
>(name: Key): PluginContext<Config> => ({
  getConfig: () => deepmerge(pluginBuilders[name].config, config.get(`plugins.${name}`) ?? {}) as unknown as Config,
  setConfig: (newConfig) => {
    config.setPartial(`plugins.${name}`, newConfig);
  },
});


const preloadedPluginList = [];

const pluginConfig = config.plugins.getPlugins();
Object.entries(preloadPlugins)
  .filter(([id]) => {
    const typedId = id as keyof PluginBuilderList;
    const config = deepmerge(pluginBuilders[typedId].config, pluginConfig[typedId] ?? {});

    return config.enabled;
  })
  .forEach(async ([id]) => {
  if (Object.hasOwn(preloadPlugins, id)) {
    const factory = (preloadPlugins as Record<string, PreloadPluginFactory<PluginBaseConfig>>)[id];

    try {
      const context = createContext(id as keyof PluginBuilderList);
      const plugin = await factory(context);
      plugin.onLoad?.();
      preloadedPluginList.push(plugin);
    } catch (error) {
      console.error('[YTMusic]', `Cannot load preload plugin "${id}": ${String(error)}`);
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
