import { defineConfig, defineViteConfig } from 'electron-vite';
import builtinModules from 'builtin-modules';

import type { UserConfig } from 'vite';

export default defineConfig({
  main: defineViteConfig(({ command, mode }) => {
    const commonConfig: UserConfig = {
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
  preload: defineViteConfig(({ command, mode }) => {
    const commonConfig: UserConfig = {
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
  renderer: defineViteConfig(({ command, mode }) => {
    const commonConfig: UserConfig = {
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
