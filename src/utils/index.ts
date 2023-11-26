import type {
  BackendContext,
  PreloadContext,
  RendererContext,
} from '@/types/contexts';

import type {
  PluginDef,
  PluginConfig, PluginLifecycleExtra, PluginLifecycleSimple,
} from '@/types/plugins';

export const createPlugin = <
  BackendProperties,
  PreloadProperties,
  RendererProperties,
  Config extends PluginConfig,
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

type Options<Config extends PluginConfig> =
  | { ctx: 'backend'; context: BackendContext<Config> }
  | { ctx: 'preload'; context: PreloadContext<Config> }
  | { ctx: 'renderer'; context: RendererContext<Config> };

export const startPlugin = <Config extends PluginConfig>(id: string, def: PluginDef<unknown, unknown, unknown, Config>, options: Options<Config>) => {
  const lifecycle =
    typeof def[options.ctx] === 'function'
      ? def[options.ctx] as PluginLifecycleSimple<Config, unknown>
      : (def[options.ctx] as PluginLifecycleExtra<Config, typeof options.context, unknown>)?.start;

  if (!lifecycle) return false;

  try {
    const start = performance.now();
    lifecycle(options.context as Config & typeof options.context);

    console.log(`[YTM] Executed ${id}::${options.ctx} in ${performance.now() - start} ms`);

    return true;
  } catch (err) {
    console.log(`[YTM] Failed to start ${id}::${options.ctx}: ${String(err)}`);
    return false;
  }
};

export const stopPlugin = <Config extends PluginConfig>(id: string, def: PluginDef<unknown, unknown, unknown, Config>, options: Options<Config>) => {
  if (!def[options.ctx]) return false;
  if (typeof def[options.ctx] === 'function') return false;

  const stop = def[options.ctx] as PluginLifecycleSimple<Config, unknown>;
  if (!stop) return false;

  try {
    const start = performance.now();
    stop(options.context as Config & typeof options.context);

    console.log(`[YTM] Executed ${id}::${options.ctx} in ${performance.now() - start} ms`);

    return true;
  } catch (err) {
    console.log(
      `[YTM] Failed to execute ${id}::${options.ctx}: ${String(err)}`,
    );
    return false;
  }
};
