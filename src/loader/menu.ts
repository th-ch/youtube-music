import { deepmerge } from 'deepmerge-ts';
import { allPlugins } from 'virtual:plugins';

import config from '@/config';
import { setApplicationMenu } from '@/menu';

import type { MenuContext } from '@/types/contexts';
import type { BrowserWindow, MenuItemConstructorOptions } from 'electron';
import type { PluginConfig } from '@/types/plugins';

const menuTemplateMap: Record<string, MenuItemConstructorOptions[]> = {};
const createContext = (id: string, win: BrowserWindow): MenuContext<PluginConfig> => ({
  getConfig: () =>
    deepmerge(
      allPlugins[id].config ?? { enabled: false },
      config.get(`plugins.${id}`) ?? {},
    ) as PluginConfig,
  setConfig: (newConfig) => {
    config.setPartial(`plugins.${id}`, newConfig, allPlugins[id].config);
  },
  window: win,
  refresh: () => {
    setApplicationMenu(win);

    if (config.plugins.isEnabled('in-app-menu')) {
      win.webContents.send('refresh-in-app-menu');
    }
  },
});

export const forceLoadMenuPlugin = async (id: string, win: BrowserWindow) => {
  try {
    const plugin = allPlugins[id];
    if (!plugin) return;

    const menu = plugin.menu?.(createContext(id, win));
    if (menu) menuTemplateMap[id] = await menu;
    else return;

    console.log('[YTMusic]', `Successfully loaded '${id}::menu'`);
  } catch (err) {
    console.error('[YTMusic]', `Cannot initialize '${id}::menu': `);
    console.trace(err);
  }
};

export const loadAllMenuPlugins = (win: BrowserWindow) => {
  const pluginConfigs = config.plugins.getPlugins();

  for (const [pluginId, pluginDef] of Object.entries(allPlugins)) {
    const config = deepmerge(pluginDef.config ?? { enabled: false }, pluginConfigs[pluginId] ?? {});

    if (config.enabled) {
      forceLoadMenuPlugin(pluginId, win);
    }
  }
};

export const getMenuTemplate = (
  id: string,
): MenuItemConstructorOptions[] | undefined => {
  return menuTemplateMap[id];
};

export const getAllMenuTemplate = () => {
  return menuTemplateMap;
};
