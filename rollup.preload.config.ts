import { defineConfig } from 'rollup';
import builtinModules from 'builtin-modules';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolvePlugin from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import { string } from 'rollup-plugin-string';
import css from 'rollup-plugin-import-css';
import wasmPlugin from '@rollup/plugin-wasm';
import image from '@rollup/plugin-image';

export default defineConfig({
  plugins: [
    typescript({
      module: 'ESNext',
    }),
    nodeResolvePlugin({
      browser: false,
      preferBuiltins: true,
    }),
    commonjs({
      ignoreDynamicRequires: true,
    }),
    json(),
    string({
      include: '**/*.html',
    }),
    css(),
    wasmPlugin({
      maxFileSize: 0,
      targetEnv: 'browser',
    }),
    image({ dom: true }),
    terser({
      ecma: 2020,
    }),
    {
      closeBundle() {
        if (!process.env.ROLLUP_WATCH) {
          setTimeout(() => process.exit(0));
        }
      },
      name: 'force-close',
    },
  ],
  input: './src/preload.ts',
  output: {
    format: 'cjs',
    name: '[name].js',
    dir: './dist',
  },
  external: ['electron', 'custom-electron-prompt', ...builtinModules],
});
