
import store from './store';

import { restart } from '../providers/app-controls';

import type { PluginBaseConfig } from '../plugins/utils/builder';

export function getPlugins() {
  return store.get('plugins') as Record<string, PluginBaseConfig>;
}

export function isEnabled(plugin: string) {
  const pluginConfig = (store.get('plugins') as Record<string, PluginBaseConfig>)[plugin];
  return pluginConfig !== undefined && pluginConfig.enabled;
}

/**
 * Set options for a plugin
 * @param plugin Plugin name
 * @param options Options to set
 * @param exclude Options to exclude from the options object
 */
export function setOptions<T>(plugin: string, options: T, exclude: string[] = ['enabled']) {
  const plugins = store.get('plugins') as Record<string, T>;
  // HACK: This is a workaround for preventing changed options from being overwritten
  exclude.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      delete options[key as keyof T];
    }
  });
  store.set('plugins', {
    ...plugins,
    [plugin]: {
      ...plugins[plugin],
      ...options,
    },
  });
}

export function setMenuOptions<T>(plugin: string, options: T, exclude: string[] = ['enabled']) {
  setOptions(plugin, options, exclude);
  if (store.get('options.restartOnConfigChanges')) {
    restart();
  }
}

export function getOptions<T>(plugin: string): T {
  return (store.get('plugins') as Record<string, T>)[plugin];
}

export function enable(plugin: string) {
  setMenuOptions(plugin, { enabled: true }, []);
}

export function disable(plugin: string) {
  setMenuOptions(plugin, { enabled: false }, []);
}

export default {
  isEnabled,
  getPlugins,
  enable,
  disable,
  setOptions,
  setMenuOptions,
  getOptions,
};
