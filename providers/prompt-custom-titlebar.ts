// eslint-disable-next-line import/no-unresolved
import { Titlebar, Color } from 'custom-electron-titlebar';

export default () => {
  new Titlebar({
    backgroundColor: Color.fromHex('#050505'),
    minimizable: false,
    maximizable: false,
    menu: undefined,
  });
  const mainStyle = document.querySelector<HTMLElement>('#container')?.style;
  if (mainStyle) {
    mainStyle.width = '100%';
    mainStyle.position = 'fixed';
    mainStyle.border = 'unset';
  }
};
