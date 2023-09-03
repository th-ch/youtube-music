declare module 'custom-electron-titlebar' {
  // eslint-disable-next-line import/no-unresolved
  import OriginalTitlebar from 'custom-electron-titlebar/dist/titlebar';
  // eslint-disable-next-line import/no-unresolved
  import { Color as OriginalColor } from 'custom-electron-titlebar/dist/vs/base/common/color';

  export const Color: typeof OriginalColor;
  export const Titlebar: typeof OriginalTitlebar;
}
