import { deepmerge } from 'deepmerge-ts';

import {
  PluginBaseConfig,
  PluginBuilder,
  PreloadPlugin,
  PluginContext,
  PreloadPluginFactory
} from '../plugins/utils/builder';
import config from '../config';

const allPluginFactoryList: Record<string, PreloadPluginFactory<PluginBaseConfig>> = {};
const allPluginBuilders: Record<string, PluginBuilder<string, PluginBaseConfig>> = {};
const unregisterStyleMap: Record<string, (() => void)[]> = {};
const loadedPluginMap: Record<string, PreloadPlugin<PluginBaseConfig>> = {};

const createContext = <
  Key extends keyof PluginBuilderList,
  Config extends PluginBaseConfig = PluginBuilderList[Key]['config'],
>(id: Key): PluginContext<Config> => ({
  getConfig: () => deepmerge(allPluginBuilders[id].config, config.get(`plugins.${id}`) ?? {}) as Config,
  setConfig: (newConfig) => {
    config.setPartial(`plugins.${id}`, newConfig);
  },
});

export const forceUnloadPreloadPlugin = (id: keyof PluginBuilderList) => {
  unregisterStyleMap[id]?.forEach((unregister) => unregister());
  delete unregisterStyleMap[id];

  loadedPluginMap[id]?.onUnload?.();
  delete loadedPluginMap[id];

  console.log('[YTMusic]', `"${id}" plugin is unloaded`);
};

export const forceLoadPreloadPlugin = async (id: keyof PluginBuilderList) => {
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

export const loadAllPreloadPlugins = async () => {
  const pluginConfigs = config.plugins.getPlugins();

  for (const [pluginId, builder] of Object.entries(allPluginBuilders)) {
    const typedBuilder = builder as PluginBuilderList[keyof PluginBuilderList];

    const config = deepmerge(typedBuilder.config, pluginConfigs[pluginId as keyof PluginBuilderList] ?? {});

    if (config.enabled) {
      await forceLoadPreloadPlugin(pluginId as keyof PluginBuilderList);
    } else {
      if (loadedPluginMap[pluginId as keyof PluginBuilderList]) {
        forceUnloadPreloadPlugin(pluginId as keyof PluginBuilderList);
      }
    }
  }
};

export const unloadAllPreloadPlugins = () => {
  for (const id of Object.keys(loadedPluginMap)) {
    forceUnloadPreloadPlugin(id as keyof PluginBuilderList);
  }
};

export const getLoadedPreloadPlugin = <Key extends keyof PluginBuilderList>(id: Key): PreloadPlugin<PluginBuilderList[Key]['config']> | undefined => {
  return loadedPluginMap[id];
};
export const getAllLoadedPreloadPlugins = () => {
  return loadedPluginMap;
};
export const registerPreloadPlugin = (
  id: string,
  builder: PluginBuilder<string, PluginBaseConfig>,
  factory?: PreloadPluginFactory<PluginBaseConfig>,
) => {
  if (factory) allPluginFactoryList[id] = factory;
  allPluginBuilders[id] = builder;
};
