import { deepmerge } from 'deepmerge-ts';

import { rendererPlugins } from 'virtual:plugins';

import { RendererContext } from '@/types/contexts';

import { PluginConfig, PluginDef } from '@/types/plugins';
import { startPlugin, stopPlugin } from '@/utils';

const unregisterStyleMap: Record<string, (() => void)[]> = {};
const loadedPluginMap: Record<string, PluginDef<unknown, unknown, unknown>> = {};

const createContext = <Config extends PluginConfig>(id: string): RendererContext<Config> => ({
  getConfig: () => window.mainConfig.plugins.getOptions(id),
  setConfig: async (newConfig) => {
    await window.ipcRenderer.invoke('set-config', id, newConfig);
  },
  ipc: {
    send: (event: string, ...args: unknown[]) => {
      window.ipcRenderer.send(event, ...args);
    },
    invoke: (event: string, ...args: unknown[]) => window.ipcRenderer.invoke(event, ...args),
    on: (event: string, listener: CallableFunction) => {
      window.ipcRenderer.on(event, (_, ...args: unknown[]) => {
        listener(...args);
      });
    },
  },
});

export const forceUnloadRendererPlugin = (id: string) => {
  unregisterStyleMap[id]?.forEach((unregister) => unregister());

  delete unregisterStyleMap[id];
  delete loadedPluginMap[id];

  const plugin = rendererPlugins[id];
  if (!plugin) return;

  stopPlugin(id, plugin, { ctx: 'renderer', context: createContext(id) });
  if (plugin?.stylesheets)
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

  if (hasEvaled || plugin?.stylesheets) {
    loadedPluginMap[id] = plugin;

    if (plugin?.stylesheets) {
      const styleSheetList = plugin.stylesheets.map((style) => {
        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(style);

        return styleSheet;
      });

      document.adoptedStyleSheets = [...document.adoptedStyleSheets, ...styleSheetList];
    }

    if (!hasEvaled) console.log('[YTMusic]', `"${id}" plugin is loaded`);
  } else {
    console.log('[YTMusic]', `Cannot initialize "${id}" plugin`);
  }
};

export const loadAllRendererPlugins = () => {
  const pluginConfigs = window.mainConfig.plugins.getPlugins();

  for (const [pluginId, pluginDef] of Object.entries(rendererPlugins)) {
    const config = deepmerge(pluginDef.config, pluginConfigs[pluginId] ?? {}) as PluginConfig;

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

export const getLoadedRendererPlugin = (id: string): PluginDef<unknown, unknown, unknown> | undefined => {
  return loadedPluginMap[id];
};

export const getAllLoadedRendererPlugins = () => {
  return loadedPluginMap;
};
