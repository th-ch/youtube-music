import type { YoutubePlayer } from '@/types/youtube-player';

import type {
  BackendContext,
  MenuContext,
  PreloadContext,
  RendererContext,
} from './contexts';

type Author = string;

export type PluginConfig = {
  enabled: boolean;
} & Record<string, unknown>;

type PluginExtra = Record<string, unknown>;

export type PluginLifecycleSimple<T> = (ctx: T) => void | Promise<void>;
export type PluginLifecycleExtra<T> = {
  start?: PluginLifecycleSimple<T>;
  stop?: PluginLifecycleSimple<T>;
  onConfigChange?: (newConfig: PluginConfig) => void | Promise<void>;
  onPlayerApiReady?: (playerApi: YoutubePlayer) => void | Promise<void>;
} & PluginExtra;

export type PluginLifecycle<T> = PluginLifecycleSimple<T> | PluginLifecycleExtra<T>;

export interface PluginDef {
  name: string;
  authors?: Author[];
  description?: string;
  config: PluginConfig;

  menu?: (ctx: MenuContext) => Electron.MenuItemConstructorOptions[];
  stylesheets?: string[];
  restartNeeded?: boolean;

  backend?: PluginLifecycle<BackendContext>;
  preload?: PluginLifecycle<PreloadContext>;
  renderer?: PluginLifecycle<RendererContext>;
}
