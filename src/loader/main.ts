/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { BrowserWindow, ipcMain } from 'electron';

import { deepmerge } from 'deepmerge-ts';
import { mainPlugins } from 'virtual:plugins';

import { PluginDef } from '@/types/plugins';
import { BackendContext } from '@/types/contexts';
import config from '@/config';
import { startPlugin, stopPlugin } from '@/utils';

const loadedPluginMap: Record<string, PluginDef> = {};

const createContext = (id: string, win: BrowserWindow): BackendContext => ({
  getConfig: () =>
    // @ts-expect-error ts dum dum
    deepmerge(
      mainPlugins[id].config,
      config.get(`plugins.${id}`) ?? { enabled: false },
    ),
  setConfig: (newConfig) => {
    config.setPartial(`plugins.${id}`, newConfig);
  },

  send: (event: string, ...args: unknown[]) => {
    win.webContents.send(event, ...args);
  },
  // @ts-expect-error ts dum dum
  handle: (event: string, listener) => {
    // @ts-expect-error ts dum dum
    ipcMain.handle(event, (_, ...args) => listener(...(args as never)));
  },
  // @ts-expect-error ts dum dum
  on: (event: string, listener) => {
    // @ts-expect-error ts dum dum
    ipcMain.on(event, (_, ...args) => listener(...(args as never)));
  },
});

export const forceUnloadMainPlugin = async (
  id: string,
  win: BrowserWindow,
): Promise<void> => {
  const plugin = loadedPluginMap[id]!;
  if (!plugin) return;

  return new Promise<void>((resolve, reject) => {
    try {
      const hasStopped = stopPlugin(id, plugin, {
        ctx: 'backend',
        context: createContext(id, win),
      });
      if (!hasStopped) {
        console.log(
          '[YTMusic]',
          `Cannot unload "${id}" plugin: no stop function`,
        );
        reject();
        return;
      }

      delete loadedPluginMap[id];
      console.log('[YTMusic]', `"${id}" plugin is unloaded`);
      resolve();
    } catch (err) {
      console.log('[YTMusic]', `Cannot unload "${id}" plugin: ${String(err)}`);
      reject(err);
    }
  });
};

export const forceLoadMainPlugin = async (
  id: string,
  win: BrowserWindow,
): Promise<void> => {
  const plugin = mainPlugins[id];
  if (!plugin.backend) return;

  return new Promise<void>((resolve, reject) => {
    try {
      const hasStarted = startPlugin(id, plugin, {
        ctx: 'backend',
        context: createContext(id, win),
      });
      if (!hasStarted) {
        console.log('[YTMusic]', `Cannot load "${id}" plugin`);
        reject();
        return;
      }

      loadedPluginMap[id] = plugin;
      resolve();
    } catch (err) {
      console.log(
        '[YTMusic]',
        `Cannot initialize "${id}" plugin: ${String(err)}`,
      );
      reject(err);
    }
  });
};

export const loadAllMainPlugins = async (win: BrowserWindow) => {
  const pluginConfigs = config.plugins.getPlugins();
  const queue: Promise<void>[] = [];

  for (const [plugin, pluginDef] of Object.entries(mainPlugins)) {
    const config = deepmerge(pluginDef.config, pluginConfigs[plugin] ?? {});
    if (config.enabled) {
      queue.push(forceLoadMainPlugin(plugin, win));
    } else if (loadedPluginMap[plugin]) {
      queue.push(forceUnloadMainPlugin(plugin, win));
    }
  }

  await Promise.all(queue);
};

export const unloadAllMainPlugins = (win: BrowserWindow) => {
  for (const id of Object.keys(loadedPluginMap)) {
    forceUnloadMainPlugin(id as keyof PluginBuilderList, win);
  }
};

export const getLoadedMainPlugin = (id: string): PluginDef | undefined => {
  return loadedPluginMap[id];
};

export const getAllLoadedMainPlugins = () => {
  return loadedPluginMap;
};
