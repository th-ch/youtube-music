import { BrowserWindow } from 'electron';

import { setMenuOptions } from '../../config/plugins';

import { MenuTemplate } from '../../menu';

import type { ConfigType } from '../../config/dynamic';

export default (_: BrowserWindow, options: ConfigType<'disable-autoplay'>): MenuTemplate => [
  {
    label: 'Applies only on startup',
    type: 'checkbox',
    checked: options.applyOnce,
    click() {
      setMenuOptions('disable-autoplay', {
        applyOnce: !options.applyOnce,
      });
    }
  }
];
