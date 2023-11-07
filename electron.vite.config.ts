import { existsSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';

import { defineConfig, defineViteConfig } from 'electron-vite';
import builtinModules from 'builtin-modules';
import viteResolve from 'vite-plugin-resolve';

import { globSync } from 'glob';

import type { UserConfig } from 'vite';

const pluginImportGenerator = (mode: 'back' | 'preload' | 'front') => {
  let homePath = resolve(__dirname, 'src');

  const plugins = globSync(`${homePath}/../src/plugins/*`)
    .map((path) => ({ name: basename(path), path }))
    .filter(({ name, path }) => !name.startsWith('utils') && existsSync(resolve(path, `${mode}.ts`)));

  let result = '';

  for (const { name, path } of plugins) {
    result += `import ${snakeToCamel(name)}Plugin from "./${relative(resolve(homePath, '..'), path).replace(/\\/g, '/')}/${mode}";\n`;
  }

  result += `export const pluginList = {\n`;
  for (const { name } of plugins) {
    result += `  "${name}": ${snakeToCamel(name)}Plugin,\n`;
  }
  result += '};';

  return result;
}

const snakeToCamel = (text: string) => text.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());

export default defineConfig({
  main: defineViteConfig(({ mode }) => {
    const commonConfig: UserConfig = {
      plugins: [
        viteResolve({
          mainPlugins: pluginImportGenerator('back'),
        }),
      ],
      publicDir: 'assets',
      build: {
        lib: {
          entry: 'src/index.ts',
          formats: ['cjs'],
        },
        outDir: 'dist/main',
        commonjsOptions: {
          ignoreDynamicRequires: true,
        },
        rollupOptions: {
          external: ['electron', 'custom-electron-prompt', ...builtinModules],
          input: './src/index.ts',
        },
      },
    };

    if (mode === 'development') {
      return commonConfig;
    }

    return {
      ...commonConfig,
      build: {
        ...commonConfig.build,
        minify: true,
        cssMinify: true,
      },
    };
  }),
  preload: defineViteConfig(({ mode }) => {
    const commonConfig: UserConfig = {
      plugins: [
        viteResolve({
          preloadPlugins: pluginImportGenerator('preload'),
        }),
      ],
      build: {
        lib: {
          entry: 'src/preload.ts',
          formats: ['cjs'],
        },
        outDir: 'dist/preload',
        commonjsOptions: {
          ignoreDynamicRequires: true,
        },
        rollupOptions: {
          external: ['electron', 'custom-electron-prompt', ...builtinModules],
          input: './src/preload.ts',
        }
      },
    };

    if (mode === 'development') {
      return commonConfig;
    }

    return {
      ...commonConfig,
      build: {
        ...commonConfig.build,
        minify: true,
        cssMinify: true,
      },
    };
  }),
  renderer: defineViteConfig(({ mode }) => {
    const commonConfig: UserConfig = {
      plugins: [
        viteResolve({
          rendererPlugins: pluginImportGenerator('front'),
        }),
      ],
      root: './src/',
      build: {
        lib: {
          entry: 'src/index.html',
          formats: ['iife'],
          name: 'renderer',
        },
        outDir: 'dist/renderer',
        commonjsOptions: {
          ignoreDynamicRequires: true,
        },
        rollupOptions: {
          external: ['electron', ...builtinModules],
          input: './src/index.html',
        },
      },
    };

    if (mode === 'development') {
      return commonConfig;
    }

    return {
      ...commonConfig,
      build: {
        ...commonConfig.build,
        minify: true,
        cssMinify: true,
      },
    };
  }),
});
