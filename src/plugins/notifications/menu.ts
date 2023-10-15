import is from 'electron-is';

import { BrowserWindow, MenuItem } from 'electron';

import { snakeToCamel, ToastStyles, urgencyLevels } from './utils';

import config from './config';

import { MenuTemplate } from '../../menu';

import type { ConfigType } from '../../config/dynamic';

const getMenu = (options: ConfigType<'notifications'>): MenuTemplate => {
  if (is.linux()) {
    return [
      {
        label: 'Notification Priority',
        submenu: urgencyLevels.map((level) => ({
          label: level.name,
          type: 'radio',
          checked: options.urgency === level.value,
          click: () => config.set('urgency', level.value),
        })),
      }
    ];
  } else if (is.windows()) {
    return [
      {
        label: 'Interactive Notifications',
        type: 'checkbox',
        checked: options.interactive,
        // Doesn't update until restart
        click: (item: MenuItem) => config.setAndMaybeRestart('interactive', item.checked),
      },
      {
        // Submenu with settings for interactive notifications (name shouldn't be too long)
        label: 'Interactive Settings',
        submenu: [
          {
            label: 'Open/Close on tray click',
            type: 'checkbox',
            checked: options.trayControls,
            click: (item: MenuItem) => config.set('trayControls', item.checked),
          },
          {
            label: 'Hide Button Text',
            type: 'checkbox',
            checked: options.hideButtonText,
            click: (item: MenuItem) => config.set('hideButtonText', item.checked),
          },
          {
            label: 'Refresh on Play/Pause',
            type: 'checkbox',
            checked: options.refreshOnPlayPause,
            click: (item: MenuItem) => config.set('refreshOnPlayPause', item.checked),
          },
        ],
      },
      {
        label: 'Style',
        submenu: getToastStyleMenuItems(options),
      },
    ];
  } else {
    return [];
  }
};

export default (_win: BrowserWindow, options: ConfigType<'notifications'>): MenuTemplate => [
  ...getMenu(options),
  {
    label: 'Show notification on unpause',
    type: 'checkbox',
    checked: options.unpauseNotification,
    click: (item: MenuItem) => config.set('unpauseNotification', item.checked),
  },
];

export function getToastStyleMenuItems(options: ConfigType<'notifications'>) {
  const array = Array.from({ length: Object.keys(ToastStyles).length });

  // ToastStyles index starts from 1
  for (const [name, index] of Object.entries(ToastStyles)) {
    array[index - 1] = {
      label: snakeToCamel(name),
      type: 'radio',
      checked: options.toastStyle === index,
      click: () => config.set('toastStyle', index),
    } satisfies Electron.MenuItemConstructorOptions;
  }

  return array as Electron.MenuItemConstructorOptions[];
}
