import { deepmerge } from 'deepmerge-ts';

import { MenuPluginContext, MenuPluginFactory, PluginBaseConfig, PluginBuilder } from '../plugins/utils/builder';
import config from '../config';
import { setApplicationMenu } from '../menu';

import type { BrowserWindow, MenuItemConstructorOptions } from 'electron';

const allPluginFactoryList: Record<string, MenuPluginFactory<PluginBaseConfig>> = {};
const allPluginBuilders: Record<string, PluginBuilder<string, PluginBaseConfig>> = {};
const menuTemplateMap: Record<string, MenuItemConstructorOptions[]> = {};

const createContext = <
  Key extends keyof PluginBuilderList,
  Config extends PluginBaseConfig = PluginBuilderList[Key]['config'],
>(id: Key, win: BrowserWindow): MenuPluginContext<Config> => ({
  getConfig: () => deepmerge(allPluginBuilders[id].config, config.get(`plugins.${id}`) ?? {}) as Config,
  setConfig: (newConfig) => {
    config.setPartial(`plugins.${id}`, newConfig);
  },
  window: win,
  refresh: async () => {
    await setApplicationMenu(win);

    if (config.plugins.isEnabled('in-app-menu')) {
      win.webContents.send('refresh-in-app-menu');
    }
  },
});

export const forceLoadMenuPlugin = async (id: keyof PluginBuilderList, win: BrowserWindow) => {
  try {
    const factory = allPluginFactoryList[id];
    if (!factory) return;

    const context = createContext(id, win);
    menuTemplateMap[id] = await factory(context);

    console.log('[YTMusic]', `"${id}" plugin is loaded`);
  } catch (err) {
    console.log('[YTMusic]', `Cannot initialize "${id}" plugin: ${String(err)}`);
  }
};

export const loadAllMenuPlugins = async (win: BrowserWindow) => {
  const pluginConfigs = config.plugins.getPlugins();

  for (const [pluginId, builder] of Object.entries(allPluginBuilders)) {
    const typedBuilder = builder as PluginBuilderList[keyof PluginBuilderList];

    const config = deepmerge(typedBuilder.config, pluginConfigs[pluginId as keyof PluginBuilderList] ?? {});

    if (config.enabled) {
      await forceLoadMenuPlugin(pluginId as keyof PluginBuilderList, win);
    }
  }
};

export const getMenuTemplate = <Key extends keyof PluginBuilderList>(id: Key): MenuItemConstructorOptions[] | undefined => {
  return menuTemplateMap[id];
};
export const getAllMenuTemplate = () => {
  return menuTemplateMap;
};
export const registerMenuPlugin = (
  id: string,
  builder: PluginBuilder<string, PluginBaseConfig>,
  factory?: MenuPluginFactory<PluginBaseConfig>,
) => {
  if (factory) allPluginFactoryList[id] = factory;
  allPluginBuilders[id] = builder;
};
