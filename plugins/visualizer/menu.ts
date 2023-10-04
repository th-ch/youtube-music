import { BrowserWindow } from 'electron';

import { MenuTemplate } from '../../menu';
import { setMenuOptions } from '../../config/plugins';

import type { ConfigType } from '../../config/dynamic';

const visualizerTypes = ['butterchurn', 'vudio', 'wave']; // For bundling

export default (win: BrowserWindow, options: ConfigType<'visualizer'>): MenuTemplate => [
  {
    label: 'Type',
    submenu: visualizerTypes.map((visualizerType) => ({
      label: visualizerType,
      type: 'radio',
      checked: options.type === visualizerType,
      click() {
        options.type = visualizerType;
        setMenuOptions('visualizer', options);
      },
    })),
  },
];
