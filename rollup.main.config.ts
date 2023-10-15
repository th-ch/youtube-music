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
import copy from 'rollup-plugin-copy';

export default defineConfig({
  plugins: [
    typescript({
      module: 'ESNext',
    }),
    nodeResolvePlugin({
      browser: false,
      preferBuiltins: true,
      exportConditions: ['node', 'default', 'module', 'import'],
    }),
    commonjs({
      ignoreDynamicRequires: true,
    }),
    wasmPlugin({
      maxFileSize: 0,
      targetEnv: 'browser',
    }),
    json(),
    string({
      include: '**/*.html',
    }),
    css(),
    copy({
      targets: [
        { src: 'src/error.html', dest: 'dist/' },
        { src: 'assets', dest: 'dist/' },
      ],
    }),
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
  input: './src/index.ts',
  output: {
    format: 'cjs',
    name: '[name].js',
    dir: './dist',
  },
  external: ['electron', 'custom-electron-prompt', ...builtinModules],
});
