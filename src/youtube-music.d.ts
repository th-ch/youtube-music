declare module '*.html' {
  const html: string;

  export default html;
}
declare module '*.svg' {
  const element: SVGAElement;

  export default element;
}
declare module '*.png' {
  const element: HTMLImageElement;

  export default element;
}
declare module '*.jpg' {
  const element: HTMLImageElement;

  export default element;
}
declare module '*.css' {
  const css: string;

  export default css;
}

declare module 'rollup-plugin-string' {
  import type { Plugin } from 'rollup';

  interface PluginOptions {
    include?: string[] | string;
    exclude?: string[] | string;
    minifier?: unknown;
  }

  export function string(options?: PluginOptions): Plugin;
}