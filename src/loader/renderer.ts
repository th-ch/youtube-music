import { deepmerge } from 'deepmerge-ts';

import {
  PluginBaseConfig, PluginBuilder,
  RendererPlugin,
  RendererPluginContext,
  RendererPluginFactory
} from '../plugins/utils/builder';

const allPluginFactoryList: Record<string, RendererPluginFactory<PluginBaseConfig>> = {};
const allPluginBuilders: Record<string, PluginBuilder<string, PluginBaseConfig>> = {};
const unregisterStyleMap: Record<string, (() => void)[]> = {};
const loadedPluginMap: Record<string, RendererPlugin<PluginBaseConfig>> = {};

const createContext = <
  Key extends keyof PluginBuilderList,
  Config extends PluginBaseConfig = PluginBuilderList[Key]['config'],
>(id: Key): RendererPluginContext<Config> => ({
  getConfig: async () => {
    return await window.ipcRenderer.invoke('get-config', id) as Config;
  },
  setConfig: async (newConfig) => {
    await window.ipcRenderer.invoke('set-config', id, newConfig);
  },

  invoke: async <Return>(event: string, ...args: unknown[]): Promise<Return> => {
    return await window.ipcRenderer.invoke(event, ...args) as Return;
  },
  on: (event: string, listener) => {
    window.ipcRenderer.on(event, async (_, ...args) => listener(...args as never));
  },
});

export const forceUnloadRendererPlugin = (id: keyof PluginBuilderList) => {
  unregisterStyleMap[id]?.forEach((unregister) => unregister());
  delete unregisterStyleMap[id];

  loadedPluginMap[id]?.onUnload?.();
  delete loadedPluginMap[id];

  console.log('[YTMusic]', `"${id}" plugin is unloaded`);
};

export const forceLoadRendererPlugin = async (id: keyof PluginBuilderList) => {
  try {
    const factory = allPluginFactoryList[id];
    if (!factory) return;

    const context = createContext(id);
    const plugin = await factory(context);
    loadedPluginMap[id] = plugin;
    plugin.onLoad?.();

    console.log('[YTMusic]', `"${id}" plugin is loaded`);
  } catch (err) {
    console.log('[YTMusic]', `Cannot initialize "${id}" plugin: ${String(err)}`);
  }
};

export const loadAllRendererPlugins = async () => {
  const pluginConfigs = window.mainConfig.plugins.getPlugins();

  for (const [pluginId, builder] of Object.entries(allPluginBuilders)) {
    const typedBuilder = builder as PluginBuilderList[keyof PluginBuilderList];

    const config = deepmerge(typedBuilder.config, pluginConfigs[pluginId as keyof PluginBuilderList] ?? {});

    if (config.enabled) {
      await forceLoadRendererPlugin(pluginId as keyof PluginBuilderList);
    } else {
      if (loadedPluginMap[pluginId as keyof PluginBuilderList]) {
        forceUnloadRendererPlugin(pluginId as keyof PluginBuilderList);
      }
    }
  }
};

export const unloadAllRendererPlugins = () => {
  for (const id of Object.keys(loadedPluginMap)) {
    forceUnloadRendererPlugin(id as keyof PluginBuilderList);
  }
};

export const getLoadedRendererPlugin = <Key extends keyof PluginBuilderList>(id: Key): RendererPlugin<PluginBuilderList[Key]['config']> | undefined => {
  return loadedPluginMap[id];
};
export const getAllLoadedRendererPlugins = () => {
  return loadedPluginMap;
};
export const registerRendererPlugin = (
  id: string,
  builder: PluginBuilder<string, PluginBaseConfig>,
  factory?: RendererPluginFactory<PluginBaseConfig>,
) => {
  if (factory) allPluginFactoryList[id] = factory;
  allPluginBuilders[id] = builder;
};
