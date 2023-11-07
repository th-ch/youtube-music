declare module 'mainPlugins' {
  import type { BrowserWindow } from 'electron';
  import type { ConfigType } from './config/dynamic';

  export const pluginList: Record<string, (win: BrowserWindow, options: ConfigType) => Promise<void>>;
}

declare module 'preloadPlugins' {
  export const pluginList: Record<string, () => Promise<void>>;
}

declare module 'rendererPlugins' {
  import type { ConfigType } from './config/dynamic';

  export const pluginList: Record<string, (options: ConfigType) => Promise<void>>;
}
