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
type IF<T> = (args: T) => T;
type Promisable<T> = T | Promise<T>;

export type PluginContext<Config extends PluginBaseConfig = PluginBaseConfig> = {
  getConfig: () => Promise<Config>;
  setConfig: (config: DeepPartial<Config>) => Promise<void>;
};

export type MainPluginContext<Config extends PluginBaseConfig = PluginBaseConfig> = PluginContext<Config> & {
  send: (event: string, ...args: unknown[]) => void;
  handle: <Arguments extends unknown[], Return>(event: string, listener: (...args: Arguments) => Promisable<Return>) => void;
};
export type RendererPluginContext<Config extends PluginBaseConfig = PluginBaseConfig> = PluginContext<Config> & {
  invoke: <Return>(event: string, ...args: unknown[]) => Promise<Return>;
  on: <Arguments extends unknown[]>(event: string, listener: (...args: Arguments) => Promisable<void>) => void;
};

export type RendererPluginFactory<Config extends PluginBaseConfig> = (context: RendererPluginContext<Config>) => Promisable<RendererPlugin<Config>>;
export type MainPluginFactory<Config extends PluginBaseConfig> = (context: MainPluginContext<Config>) => Promisable<MainPlugin<Config>>;
export type PreloadPluginFactory<Config extends PluginBaseConfig> = (context: PluginContext<Config>) => Promisable<PreloadPlugin<Config>>;
export type MenuPluginFactory<Config extends PluginBaseConfig> = (context: PluginContext<Config>) => Promisable<MenuItemConstructorOptions[]>;

export type PluginBuilder<ID extends string, Config extends PluginBaseConfig> = {
  createRenderer: IF<RendererPluginFactory<Config>>;
  createMain: IF<MainPluginFactory<Config>>;
  createPreload: IF<PreloadPluginFactory<Config>>;
  createMenu: IF<MenuPluginFactory<Config>>;

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
): PluginBuilder<ID, Omit<Config, 'enabled'> & PluginBaseConfig> => ({
  createRenderer: (plugin) => plugin,
  createMain: (plugin) => plugin,
  createPreload: (plugin) => plugin,
  createMenu: (plugin) => plugin,

  id,
  name: options.name,
  config: options.config,
  styles: options.styles,
});
