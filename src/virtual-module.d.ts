declare module 'virtual:MainPlugins' {
  import type { BrowserWindow } from 'electron';
  import type { ConfigType } from './config/dynamic';

  export const mainPlugins: Record<string, (win: BrowserWindow, options: ConfigType) => Promise<void>>;
}

declare module 'virtual:MenuPlugins' {
  import type { BrowserWindow } from 'electron';
  import type { MenuTemplate } from './menu';
  import type { ConfigType } from './config/dynamic';

  export const menuPlugins: Record<string, (win: BrowserWindow, options: ConfigType, refreshMenu: () => void) => MenuTemplate>;
}

declare module 'virtual:PreloadPlugins' {
  import type { ConfigType } from './config/dynamic';

  export const preloadPlugins: Record<string, (options: ConfigType) => Promise<void>>;
}

declare module 'virtual:RendererPlugins' {
  import type { ConfigType } from './config/dynamic';

  export const rendererPlugins: Record<string, (options: ConfigType) => Promise<void>>;
}
