import { deepmerge } from 'deepmerge-ts';

import { rendererPlugins } from 'virtual:plugins';

import { RendererContext } from '@/types/contexts';

import { PluginDef } from '@/types/plugins';
import { startPlugin, stopPlugin } from '@/utils';

const unregisterStyleMap: Record<string, (() => void)[]> = {};
const loadedPluginMap: Record<string, PluginDef> = {};

const createContext = (id: string): RendererContext => ({
  getConfig: () => window.mainConfig.plugins.getOptions(id),
  setConfig: async (newConfig) => {
    await window.ipcRenderer.invoke('set-config', id, newConfig);
  },
});

export const forceUnloadRendererPlugin = (id: string) => {
  unregisterStyleMap[id]?.forEach((unregister) => unregister());

  delete unregisterStyleMap[id];
  delete loadedPluginMap[id];

  const plugin = rendererPlugins[id];
  if (!plugin) return;

  stopPlugin(id, plugin, { ctx: 'renderer', context: createContext(id) });
  if (plugin.renderer?.stylesheet)
    document.querySelector(`style#plugin-${id}`)?.remove();

  console.log('[YTMusic]', `"${id}" plugin is unloaded`);
};

export const forceLoadRendererPlugin = (id: string) => {
  const plugin = rendererPlugins[id];
  if (!plugin) return;

  const hasEvaled = startPlugin(id, plugin, {
    ctx: 'renderer',
    context: createContext(id),
  });

  if (hasEvaled || plugin.renderer?.stylesheet) {
    loadedPluginMap[id] = plugin;

    if (plugin.renderer?.stylesheet)
      document.head.appendChild(
        Object.assign(document.createElement('style'), {
          id: `plugin-${id}`,
          innerHTML: plugin.renderer?.stylesheet ?? '',
        }),
      );

    if (!hasEvaled) console.log('[YTMusic]', `"${id}" plugin is loaded`);
  } else {
    console.log('[YTMusic]', `Cannot initialize "${id}" plugin`);
  }
};

export const loadAllRendererPlugins = () => {
  const pluginConfigs = window.mainConfig.plugins.getPlugins();

  for (const [pluginId, pluginDef] of Object.entries(rendererPlugins)) {
    const config = deepmerge(pluginDef.config, pluginConfigs[pluginId] ?? {});

    if (config.enabled) {
      forceLoadRendererPlugin(pluginId);
    } else {
      if (loadedPluginMap[pluginId]) {
        forceUnloadRendererPlugin(pluginId);
      }
    }
  }
};

export const unloadAllRendererPlugins = () => {
  for (const id of Object.keys(loadedPluginMap)) {
    forceUnloadRendererPlugin(id);
  }
};

export const getLoadedRendererPlugin = (id: string): PluginDef | undefined => {
  return loadedPluginMap[id];
};

export const getAllLoadedRendererPlugins = () => {
  return loadedPluginMap;
};
