declare module 'virtual:MainPlugins' {
  import type { BrowserWindow } from 'electron';
  import type { ConfigType } from './config/dynamic';

  export const pluginList: Record<string, (win: BrowserWindow, options: ConfigType) => Promise<void>>;
}

declare module 'virtual:PreloadPlugins' {
  export const pluginList: Record<string, () => Promise<void>>;
}

declare module 'virtual:RendererPlugins' {
  import type { ConfigType } from './config/dynamic';

  export const pluginList: Record<string, (options: ConfigType) => Promise<void>>;
}
