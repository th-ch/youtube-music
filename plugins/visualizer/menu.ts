import { readdirSync } from 'node:fs';
import path from 'node:path';

import { BrowserWindow } from 'electron';

import { setMenuOptions } from '../../config/plugins';

import { MenuTemplate } from '../../menu';

import type { ConfigType } from '../../config/dynamic';

const visualizerTypes = readdirSync(path.join(__dirname, 'visualizers'))
  .map((filename) => path.parse(filename).name)
  .filter((filename) => filename !== 'visualizer');

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
