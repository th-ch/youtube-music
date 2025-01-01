import path from 'node:path';
import { defineConfig } from '@farmfe/core';
import electron from '@farmfe/js-plugin-electron';
import farmPluginPostcss from '@farmfe/js-plugin-postcss';
import solid from 'vite-plugin-solid';

export default defineConfig({
  compilation: {
    input: {
      main: 'renderer/index.html',
      settings: 'renderer/settings.html',
      lyrics: 'renderer/lyrics.html',
      tray: 'renderer/tray.html',
    },
    output: {
      path: 'dist',
    },
    external: [
      'electron',
      '@alexssmusica/ffi-napi',
      '@alexssmusica/ref-napi',
      '@jellybrick/wql-process-monitor',
      'mica-electron',
      'glasstron',
      'hmc-win32',
      'extract-file-icon',
    ],
  },
  vitePlugins: [
    () => ({
      vitePlugin: solid(),
      filters: ['\\.tsx$', '\\.jsx$']
    })
  ],
  plugins: [
    electron({
      main: {
        input: './index.ts',
        farm: {
          compilation: {
            externalNodeBuiltins: true,
            external: [
              '@alexssmusica/ffi-napi',
              '@alexssmusica/ref-napi',
              '@jellybrick/wql-process-monitor',
              'mica-electron',
              'glasstron',
              'hmc-win32',
              'extract-file-icon',
            ],
            output: {
              targetEnv: 'node-next',
              path: 'dist',
            },
          },
        },
      },
      preload: {
        input: './src/preload.ts',
        farm: {
          compilation: {
            externalNodeBuiltins: true,
            external: [
              'hmc-win32',
              'font-list',
            ],
            output: {
              targetEnv: 'node-next',
              path: 'dist',
            },
          },
        },
      },
    }),
    farmPluginPostcss(),
  ],
});
