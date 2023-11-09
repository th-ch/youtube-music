import type {
  BrowserWindow,
  MenuItemConstructorOptions,
} from 'electron';

export type PluginBaseConfig = {
  enabled: boolean;
};
export type BasePlugin<Config extends PluginBaseConfig> = {
  onLoad?: () => void;
  onConfigChange?: (newConfig: Config) => void;
}
export type RendererPlugin<Config extends PluginBaseConfig> = BasePlugin<Config>;
export type MainPlugin<Config extends PluginBaseConfig> = Omit<BasePlugin<Config>, 'onLoad'> & {
  onLoad?: (window: BrowserWindow) => void;
};
export type PreloadPlugin<Config extends PluginBaseConfig> = BasePlugin<Config>;

type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};
export type PluginContext<Config extends PluginBaseConfig> = {
  getConfig: () => Config;
  setConfig: (config: DeepPartial<Config>) => void;

  send: (event: string, ...args: unknown[]) => void;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
};

type IF<T> = (args: T) => T;
export type PluginBuilder<ID extends string, Config extends PluginBaseConfig> = {
  createRenderer: IF<(context: PluginContext<Config>) => RendererPlugin<Config>>;
  createMain: IF<(context: PluginContext<Config>) => MainPlugin<Config>>;
  createPreload: IF<(context: PluginContext<Config>) => PreloadPlugin<Config>>;
  createMenu: IF<(context: PluginContext<Config>) => MenuItemConstructorOptions[]>;

  id: ID;
  config: Config;
  name?: string;
  styles?: string[];
};
export type PluginBuilderOptions<Config extends PluginBaseConfig = PluginBaseConfig> = {
  name?: string;

  config: Config;
  styles?: string[];
}
export const createPluginBuilder = <ID extends string, Config extends PluginBaseConfig>(
  id: ID,
  options: PluginBuilderOptions<Config>,
): PluginBuilder<ID, Config> => ({
  createRenderer: (plugin) => plugin,
  createMain: (plugin) => plugin,
  createPreload: (plugin) => plugin,
  createMenu: (plugin) => plugin,

  id,
  name: options.name,
  config: options.config,
  styles: options.styles,
});
