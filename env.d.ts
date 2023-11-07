/// <reference types="vite/client" />

import type { ConfigType, OneOfDefaultConfigKey } from './src/config/dynamic';

declare global {
    type PluginMapper<Type extends 'renderer' | 'preload' | 'backend'> = {
        [Key in OneOfDefaultConfigKey]?: (
          Type extends 'renderer' ? (options: ConfigType<Key>) => (Promise<void> | void) :
            Type extends 'preload' ? () => (Promise<void> | void) :
          never
        )
      };

    const backendPlugins: PluginMapper<'backend'>;
    const preloadPlugins: PluginMapper<'preload'>;
    const rendererPlugins: PluginMapper<'renderer'>;
}

export {}
