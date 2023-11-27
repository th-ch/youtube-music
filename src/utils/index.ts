import type {
  BackendContext,
  PreloadContext,
  RendererContext,
} from '@/types/contexts';

import type {
  PluginDef,
  PluginConfig,
  PluginLifecycleExtra,
  PluginLifecycleSimple,
  PluginLifecycle,
  RendererPluginLifecycle,
} from '@/types/plugins';

export const createPlugin = <
  BackendProperties,
  PreloadProperties,
  RendererProperties,
  Config extends PluginConfig = PluginConfig,
>(
  def: PluginDef<
    BackendProperties,
    PreloadProperties,
    RendererProperties,
    Config
  > & {
    config?: Omit<Config, 'enabled'> & {
      enabled: boolean;
    };
  },
) => def;

export const createBackend = <
  BackendProperties,
  Config extends PluginConfig = PluginConfig,
>(
  back: {
    [Key in keyof BackendProperties]: BackendProperties[Key];
  } & PluginLifecycle<Config, BackendContext<Config>, BackendProperties>,
) => back;

export const createPreload = <
  PreloadProperties,
  Config extends PluginConfig = PluginConfig,
>(
  preload: {
    [Key in keyof PreloadProperties]: PreloadProperties[Key];
  } & PluginLifecycle<Config, PreloadContext<Config>, PreloadProperties>,
) => preload;

export const createRenderer = <
  RendererProperties,
  Config extends PluginConfig = PluginConfig,
>(
  renderer: {
    [Key in keyof RendererProperties]: RendererProperties[Key];
  } & RendererPluginLifecycle<
    Config,
    RendererContext<Config>,
    RendererProperties
  >,
) => renderer;

type Options<Config extends PluginConfig> =
  | { ctx: 'backend'; context: BackendContext<Config> }
  | { ctx: 'preload'; context: PreloadContext<Config> }
  | { ctx: 'renderer'; context: RendererContext<Config> };

export const startPlugin = <Config extends PluginConfig>(
  id: string,
  def: PluginDef<unknown, unknown, unknown, Config>,
  options: Options<Config>,
) => {
  const lifecycle =
    typeof def[options.ctx] === 'function'
      ? (def[options.ctx] as PluginLifecycleSimple<Config, unknown>)
      : (
          def[options.ctx] as PluginLifecycleExtra<
            Config,
            typeof options.context,
            unknown
          >
        )?.start;

  if (!lifecycle) return null;

  try {
    const defContext = def[options.ctx];
    if (defContext && typeof defContext !== 'function') {
      Object.entries(defContext).forEach(([key, value]) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        if (typeof value === 'function')
          defContext[key as keyof typeof defContext] = value.bind(defContext);
      });
    }

    const start = performance.now();
    lifecycle.bind(def[options.ctx])(
      options.context as Config & typeof options.context,
    );

    console.log(
      `[YTMusic] Executed ${id}::${options.ctx} in ${
        performance.now() - start
      } ms`,
    );

    return true;
  } catch (err) {
    console.error(`[YTMusic] Failed to start ${id}::${options.ctx}`);
    console.trace(err);
    return false;
  }
};

export const stopPlugin = <Config extends PluginConfig>(
  id: string,
  def: PluginDef<unknown, unknown, unknown, Config>,
  options: Options<Config>,
) => {
  if (!def || !def[options.ctx]) return false;
  if (typeof def[options.ctx] === 'function') return false;

  const stop = def[options.ctx] as PluginLifecycleSimple<Config, unknown>;
  if (!stop) return null;

  try {
    const start = performance.now();
    stop.bind(def[options.ctx])(
      options.context as Config & typeof options.context,
    );

    console.log(
      `[YTMusic] Executed ${id}::${options.ctx} in ${
        performance.now() - start
      } ms`,
    );

    return true;
  } catch (err) {
    console.error(`[YTMusic] Failed to execute ${id}::${options.ctx}`);
    console.trace(err);
    return false;
  }
};
