import { Titlebar, Color } from 'custom-electron-titlebar';

export default () => {
  new Titlebar({
    backgroundColor: Color.fromHex('#050505'),
    minimizable: false,
    maximizable: false,
    menu: undefined,
  });
  const mainStyle = (document.querySelector('#container') as HTMLElement)!.style;
  mainStyle.width = '100%';
  mainStyle.position = 'fixed';
  mainStyle.border = 'unset';
};
