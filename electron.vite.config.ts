import { defineConfig } from 'electron-vite';
import builtinModules from 'builtin-modules';

export default defineConfig({
  main: {
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
  },
  preload: {
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
  },
  renderer: {
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
  },
});
