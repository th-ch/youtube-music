import type { Config, MainPlugin, MenuPlugin, PreloadPlugin } from '../common';

export const defineMainPlugin = <ConfigType extends Config>(
  plugin: MainPlugin<ConfigType>,
) => plugin;

export const definePreloadPlugin = <ConfigType extends Config>(
  plugin: PreloadPlugin<ConfigType>,
) => plugin;

export const defineMenuPlugin = <ConfigType extends Config>(
  plugin: MenuPlugin<ConfigType>,
) => plugin;
