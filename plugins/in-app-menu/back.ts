import { register } from 'electron-localshortcut';

import { BrowserWindow, Menu, MenuItem, ipcMain } from 'electron';

import titlebarStyle from './titlebar.css';

import { injectCSS } from '../utils';

// Tracks menu visibility
export default (win: BrowserWindow) => {
  injectCSS(win.webContents, titlebarStyle);

  win.once('ready-to-show', () => {
    register(win, '`', () => {
      win.webContents.send('toggleMenu');
    });
  });

  ipcMain.handle(
    'get-menu',
    () => JSON.parse(JSON.stringify(
      Menu.getApplicationMenu(),
      (key: string, value: unknown) => (key !== 'commandsMap' && key !== 'menu') ? value : undefined),
    ),
  );

  const getMenuItemById = (commandId: number): MenuItem | null => {
    const menu = Menu.getApplicationMenu();

    let target: MenuItem | null = null;
    const stack = [...menu?.items ?? []];
    while (stack.length > 0) {
      const now = stack.shift();
      now?.submenu?.items.forEach((item) => stack.push(item));

      if (now?.commandId === commandId) {
        target = now;
        break;
      }
    }

    return target;
  };

  ipcMain.handle('menu-event', (event, commandId: number) => {
    const target = getMenuItemById(commandId);
    if (target) target.click(undefined, BrowserWindow.fromWebContents(event.sender), event.sender);
  });

  ipcMain.handle('get-menu-by-id', (_, commandId: number) => {
    const result = getMenuItemById(commandId);

    return JSON.parse(JSON.stringify(
      result,
      (key: string, value: unknown) => (key !== 'commandsMap' && key !== 'menu') ? value : undefined),
    );
  });

  ipcMain.handle('window-is-maximized', () => win.isMaximized());

  ipcMain.handle('window-close', () => win.close());
  ipcMain.handle('window-minimize', () => win.minimize());
  ipcMain.handle('window-maximize', () => win.maximize());
  win.on('maximize', () => win.webContents.send('window-maximize'));
  ipcMain.handle('window-unmaximize', () => win.unmaximize());
  win.on('unmaximize', () => win.webContents.send('window-unmaximize'));
};
