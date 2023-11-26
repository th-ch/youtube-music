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
} from '@/types/plugins';

export const createPlugin = (
  def: Omit<PluginDef, 'config'> & {
    config?: Omit<PluginConfig, 'enabled'>;
  },
): PluginDef => def as PluginDef;

type Options =
  | { ctx: 'backend'; context: BackendContext }
  | { ctx: 'preload'; context: PreloadContext }
  | { ctx: 'renderer'; context: RendererContext };

export const startPlugin = (id: string, def: PluginDef, options: Options) => {
  const lifecycle =
    typeof def[options.ctx] === 'function'
      ? def[options.ctx] as PluginLifecycleSimple<Options['context']>
      : (def[options.ctx] as PluginLifecycleExtra<Options['context']>)?.start;

  if (!lifecycle) return false;

  try {
    const start = performance.now();
    lifecycle(options.context);

    console.log(`[YTM] Executed ${id}::${options.ctx} in ${performance.now() - start} ms`);

    return true;
  } catch (err) {
    console.log(`[YTM] Failed to start ${id}::${options.ctx}: ${String(err)}`);
    return false;
  }
};

export const stopPlugin = (id: string, def: PluginDef, options: Options) => {
  if (!def[options.ctx]) return false;
  if (typeof def[options.ctx] === 'function') return false;

  const stop = def[options.ctx] as PluginLifecycleExtra<Options['context']>['stop'];
  if (!stop) return false;

  try {
    const start = performance.now();
    stop(options.context);

    console.log(`[YTM] Executed ${id}::${options.ctx} in ${performance.now() - start} ms`);

    return true;
  } catch (err) {
    console.log(
      `[YTM] Failed to execute ${id}::${options.ctx}: ${String(err)}`,
    );
    return false;
  }
};
