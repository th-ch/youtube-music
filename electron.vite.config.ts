import { defineConfig } from 'electron-vite';
import builtinModules from 'builtin-modules';
import { importChunkUrl } from '@lightningjs/vite-plugin-import-chunk-url';

export default defineConfig({
  main: {
    plugins: [
      importChunkUrl()
    ],
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
    build: {
      lib: {
        entry: 'src/renderer.ts',
        formats: ['cjs'],
      },
      outDir: 'dist/renderer',
      commonjsOptions: {
        ignoreDynamicRequires: true,
      },
      rollupOptions: {
        external: ['electron', ...builtinModules],
        input: './src/renderer.ts',
      },
    },
  },
});
