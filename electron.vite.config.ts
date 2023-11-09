import { defineConfig, defineViteConfig } from 'electron-vite';
import builtinModules from 'builtin-modules';
import viteResolve from 'vite-plugin-resolve';

import { pluginVirtualModuleGenerator } from './vite-plugins/plugin-virtual-module-generator';

import type { UserConfig } from 'vite';

export default defineConfig({
  main: defineViteConfig(({ mode }) => {
    const commonConfig: UserConfig = {
      plugins: [
        viteResolve({
          'virtual:MainPlugins': pluginVirtualModuleGenerator('back'),
          'virtual:MenuPlugins': pluginVirtualModuleGenerator('menu'),
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
          'virtual:PreloadPlugins': pluginVirtualModuleGenerator('preload'),
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
          'virtual:RendererPlugins': pluginVirtualModuleGenerator('front'),
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
