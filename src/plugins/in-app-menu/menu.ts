import { BrowserWindow } from 'electron';

import is from 'electron-is';

import { setMenuOptions } from '../../config/plugins';

import type { MenuTemplate } from '../../menu';
import type { ConfigType } from '../../config/dynamic';

export default (_: BrowserWindow, config: ConfigType<'in-app-menu'>): MenuTemplate => [
  ...(is.linux() ? [
    {
      label: 'Hide DOM Window Controls',
      type: 'checkbox',
      checked: config.hideDOMWindowControls,
      click(item) {
        config.hideDOMWindowControls = item.checked;
        setMenuOptions('in-app-menu', config);
      }
    }
  ] : []) satisfies Electron.MenuItemConstructorOptions[],
];
