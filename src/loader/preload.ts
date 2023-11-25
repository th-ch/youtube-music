import { deepmerge } from 'deepmerge-ts';
import { preloadPlugins } from 'virtual:plugins';

import { type PluginDef } from '@/types/plugins';
import { type PreloadContext } from '@/types/contexts';
import { startPlugin, stopPlugin } from '@/utils';

import config from '@/config';

const loadedPluginMap: Record<string, PluginDef> = {};
const createContext = (id: string): PreloadContext => ({
  getConfig: () => config.plugins.getOptions(id),
  setConfig: (newConfig) => {
    config.setPartial(`plugins.${id}`, newConfig);
  },
});

export const forceUnloadPreloadPlugin = (id: string) => {
  const hasStopped = stopPlugin(id, loadedPluginMap[id], {
    ctx: 'preload',
    context: createContext(id),
  });
  if (!hasStopped) {
    console.log('[YTMusic]', `Cannot stop "${id}" plugin`);
    return;
  }
  console.log('[YTMusic]', `"${id}" plugin is unloaded`);
};

export const forceLoadPreloadPlugin = (id: string) => {
  try {
    const plugin = preloadPlugins[id];
    if (!plugin) return;

    const hasStarted = startPlugin(id, plugin, {
      ctx: 'preload',
      context: createContext(id),
    });

    if (hasStarted) loadedPluginMap[id] = plugin;

    console.log('[YTMusic]', `"${id}" plugin is loaded`);
  } catch (err) {
    console.log(
      '[YTMusic]',
      `Cannot initialize "${id}" plugin: ${String(err)}`,
    );
  }
};

export const loadAllPreloadPlugins = () => {
  const pluginConfigs = config.plugins.getPlugins();

  for (const [pluginId, pluginDef] of Object.entries(preloadPlugins)) {
    const config = deepmerge(pluginDef.config, pluginConfigs[pluginId] ?? {});

    if (config.enabled) {
      forceLoadPreloadPlugin(pluginId);
    } else {
      if (loadedPluginMap[pluginId]) {
        forceUnloadPreloadPlugin(pluginId);
      }
    }
  }
};

export const unloadAllPreloadPlugins = () => {
  for (const id of Object.keys(loadedPluginMap)) {
    forceUnloadPreloadPlugin(id as keyof PluginBuilderList);
  }
};

export const getLoadedPreloadPlugin = (id: string): PluginDef | undefined => {
  return loadedPluginMap[id];
};

export const getAllLoadedPreloadPlugins = () => {
  return loadedPluginMap;
};
