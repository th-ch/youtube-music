
declare module 'virtual:MainPlugins' {
  import type { MainPluginFactory } from './plugins/utils/builder';

  export const mainPlugins: Record<string, MainPluginFactory>;
}

declare module 'virtual:MenuPlugins' {
  import type { MenuPluginFactory } from './plugins/utils/builder';

  export const menuPlugins: Record<string, MenuPluginFactory>;
}

declare module 'virtual:PreloadPlugins' {
  import type { PreloadPluginFactory } from './plugins/utils/builder';

  export const preloadPlugins: Record<string, PreloadPluginFactory>;
}

declare module 'virtual:RendererPlugins' {
  import type { RendererPluginFactory } from './plugins/utils/builder';

  export const rendererPlugins: Record<string, RendererPluginFactory>;
}
