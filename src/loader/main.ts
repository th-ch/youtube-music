import { BrowserWindow, ipcMain } from 'electron';

import { deepmerge } from 'deepmerge-ts';

import config from '../config';
import { injectCSS } from '../plugins/utils/main';
import {
  MainPlugin,
  MainPluginContext,
  MainPluginFactory,
  PluginBaseConfig,
  PluginBuilder
} from '../plugins/utils/builder';

const allPluginFactoryList: Record<string, MainPluginFactory<PluginBaseConfig>> = {};
const allPluginBuilders: Record<string, PluginBuilder<string, PluginBaseConfig>> = {};
const unregisterStyleMap: Record<string, (() => void)[]> = {};
const loadedPluginMap: Record<string, MainPlugin<PluginBaseConfig>> = {};

const createContext = <
  Key extends keyof PluginBuilderList,
  Config extends PluginBaseConfig = PluginBuilderList[Key]['config'],
>(id: Key, win: BrowserWindow): MainPluginContext<Config> => ({
  getConfig: () => deepmerge(allPluginBuilders[id].config, config.get(`plugins.${id}`) ?? {}) as Config,
  setConfig: (newConfig) => {
    config.setPartial(`plugins.${id}`, newConfig);
  },

  send: (event: string, ...args: unknown[]) => {
    win.webContents.send(event, ...args);
  },
  handle: (event: string, listener) => {
    ipcMain.handle(event, async (_, ...args) => listener(...args as never));
  },
  on: (event: string, listener) => {
    ipcMain.on(event, async (_, ...args) => listener(...args as never));
  },
});

const forceUnloadMainPlugin = (id: keyof PluginBuilderList, win: BrowserWindow) => {
  unregisterStyleMap[id]?.forEach((unregister) => unregister());
  delete unregisterStyleMap[id];

  loadedPluginMap[id]?.onUnload?.(win);
  delete loadedPluginMap[id];

  console.log('[YTMusic]', `"${id}" plugin is unloaded`);
};

export const forceLoadMainPlugin = async (id: keyof PluginBuilderList, win: BrowserWindow) => {
  const builder = allPluginBuilders[id];

  Promise.allSettled(
    builder.styles?.map(async (style) => {
      const unregister = await injectCSS(win.webContents, style);
      console.log('[YTMusic]', `Injected CSS for "${id}" plugin`);

      return unregister;
    }) ?? [],
  ).then((result) => {
    unregisterStyleMap[id] = result
      .map((it) => it.status === 'fulfilled' && it.value)
      .filter(Boolean);

    let isInjectSuccess = true;
    result.forEach((it) => {
      if (it.status === 'rejected') {
        isInjectSuccess = false;

        console.log('[YTMusic]', `Cannot inject "${id}" plugin style: ${String(it.reason)}`);
      }
    });
    if (isInjectSuccess) console.log('[YTMusic]', `"${id}" plugin data is loaded`);
  });

  try {
    const factory = allPluginFactoryList[id];
    if (!factory) return;

    const context = createContext(id, win);
    const plugin = await factory(context);
    loadedPluginMap[id] = plugin;
    plugin.onLoad?.(win);

    console.log('[YTMusic]', `"${id}" plugin is loaded`);
  } catch (err) {
    console.log('[YTMusic]', `Cannot initialize "${id}" plugin: ${String(err)}`);
  }
};

export const loadAllMainPlugins = async (win: BrowserWindow) => {
  const pluginConfigs = config.plugins.getPlugins();

  for (const [pluginId, builder] of Object.entries(allPluginBuilders)) {
    const typedBuilder = builder as PluginBuilderList[keyof PluginBuilderList];

    const config = deepmerge(typedBuilder.config, pluginConfigs[pluginId as keyof PluginBuilderList] ?? {});

    if (config.enabled) {
      await forceLoadMainPlugin(pluginId as keyof PluginBuilderList, win);
    } else {
      if (loadedPluginMap[pluginId as keyof PluginBuilderList]) {
        forceUnloadMainPlugin(pluginId as keyof PluginBuilderList, win);
      }
    }
  }
};

export const unloadAllMainPlugins = (win: BrowserWindow) => {
  for (const id of Object.keys(loadedPluginMap)) {
    forceUnloadMainPlugin(id as keyof PluginBuilderList, win);
  }
};

export const getLoadedMainPlugin = <Key extends keyof PluginBuilderList>(id: Key): MainPlugin<PluginBuilderList[Key]['config']> | undefined => {
  return loadedPluginMap[id];
};
export const getAllLoadedMainPlugins = () => {
  return loadedPluginMap;
};
export const registerMainPlugin = (
  id: string,
  builder: PluginBuilder<string, PluginBaseConfig>,
  factory?: MainPluginFactory<PluginBaseConfig>,
) => {
  if (factory) allPluginFactoryList[id] = factory;
  allPluginBuilders[id] = builder;
};
