declare module 'virtual:MainPlugins' {
  import type { MainPluginFactory, PluginBaseConfig } from './plugins/utils/builder';

  export const mainPlugins: Record<string, MainPluginFactory<PluginBaseConfig>>;
}

declare module 'virtual:MenuPlugins' {
  import type { MenuPluginFactory, PluginBaseConfig } from './plugins/utils/builder';

  export const menuPlugins: Record<string, MenuPluginFactory<PluginBaseConfig>>;
}

declare module 'virtual:PreloadPlugins' {
  import type { PreloadPluginFactory, PluginBaseConfig } from './plugins/utils/builder';

  export const preloadPlugins: Record<string, PreloadPluginFactory<PluginBaseConfig>>;
}

declare module 'virtual:RendererPlugins' {
  import type { RendererPluginFactory, PluginBaseConfig } from './plugins/utils/builder';

  export const rendererPlugins: Record<string, RendererPluginFactory<PluginBaseConfig>>;
}

declare module 'virtual:PluginBuilders' {
  export const pluginBuilders: PluginBuilderList;
}