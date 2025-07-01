import type { Plugin } from 'vite';
import type { LoadResult } from 'rollup';

interface ResolveOptions {
  [moduleId: string]:
    | LoadResult
    | ((id: string, opts?: { ssr?: boolean }) => LoadResult);
}

export default function (options: ResolveOptions): Plugin[] {
  const prefix = '\0plugin-resolve:';
  const resolveKeys = Object.keys(options);
  const resolveKeysWithPrefix = resolveKeys.map((key) => prefix + key);

  return [
    {
      name: 'vite-plugin-resolve:resolveId',
      // Run before the builtin 'vite:resolve' of Vite
      enforce: 'pre',
      resolveId(source) {
        if (resolveKeys.includes(source)) {
          // @see - https://vitejs.dev/guide/api-plugin.html#virtual-modules-convention
          return prefix + source;
        }
        return null;
      },
    },
    {
      name: 'vite-plugin-resolve',
      config(config) {
        if (!config.optimizeDeps) config.optimizeDeps = {};
        if (!config.optimizeDeps.exclude) config.optimizeDeps.exclude = [];

        let keys = resolveKeys;
        if (config.optimizeDeps.include) {
          keys = resolveKeys.filter(
            (key) => !config.optimizeDeps?.include?.includes(key),
          );
        }

        config.optimizeDeps.exclude.push(...keys);
      },
      load(id, opts) {
        if (resolveKeysWithPrefix.includes(id)) {
          const stringOrFunction = options[id.replace(prefix, '')];
          return typeof stringOrFunction === 'function'
            ? stringOrFunction.apply(this, [id, opts])
            : {
                code: stringOrFunction as string,
                moduleType: 'ts',
              };
        }
      },
    },
  ];
}
