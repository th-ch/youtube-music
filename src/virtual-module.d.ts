declare module 'virtual:MainPlugins' {
  import type { BrowserWindow } from 'electron';
  import type { ConfigType } from './config/dynamic';

  export const pluginList: Record<string, (win: BrowserWindow, options: ConfigType) => Promise<void>>;
}

declare module 'virtual:MenuPlugins' {
  import type { BrowserWindow } from 'electron';
  import type { MenuTemplate } from './menu';
  import type { ConfigType } from './config/dynamic';

  export const pluginList: Record<string, (win: BrowserWindow, options: ConfigType, refreshMenu: () => void) => MenuTemplate>;
}

declare module 'virtual:PreloadPlugins' {
  import type { ConfigType } from './config/dynamic';

  export const pluginList: Record<string, (options: ConfigType) => Promise<void>>;
}

declare module 'virtual:RendererPlugins' {
  import type { ConfigType } from './config/dynamic';

  export const pluginList: Record<string, (options: ConfigType) => Promise<void>>;
}
