declare module 'virtual:plugins' {
  import type { PluginDef } from '@/types/plugins';

  export const mainPlugins: Record<string, PluginDef>;
  export const menuPlugins: Record<string, PluginDef>;
  export const preloadPlugins: Record<string, PluginDef>;
  export const rendererPlugins: Record<string, PluginDef>;

  export const allPlugins: Record<
    string,
    Omit<PluginDef, 'backend' | 'preload' | 'renderer'>
  >;
}
