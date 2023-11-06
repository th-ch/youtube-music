/// <reference types="electron-vite/node" />

declare module '*.html' {
  const html: string;

  export default html;
}
declare module '*.html?raw' {
  const html: string;

  export default html;
}
declare module '*?importChunkUrl' {
  const source: string;

  export default source;
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
