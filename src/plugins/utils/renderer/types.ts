import type { Config, RendererPlugin } from '../common';

export const defineRendererPlugin = <ConfigType extends Config>(plugin: RendererPlugin<ConfigType>) => plugin;
