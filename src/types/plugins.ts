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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PluginExtra = Record<string, any>;

type PluginLifecycle<T> =
  | ((ctx: T) => void | Promise<void>)
  | ({
      start?(ctx: T): void | Promise<void>;
      stop?(ctx: T): void | Promise<void>;
    } & PluginExtra);

export interface PluginDef {
  name: string;
  authors?: Author[];
  description?: string;
  config: PluginConfig;

  menu?: (ctx: MenuContext) => Electron.MenuItemConstructorOptions[];
  restartNeeded?: boolean;

  backend?: PluginLifecycle<BackendContext>;
  preload?: PluginLifecycle<PreloadContext>;
  renderer?: PluginLifecycle<RendererContext> & {
    stylesheet?: string;
  };
}
