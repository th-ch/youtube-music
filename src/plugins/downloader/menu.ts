import { dialog } from 'electron';

import { downloadPlaylist } from './back';
import { defaultMenuDownloadLabel, getFolder } from './utils';
import { DefaultPresetList } from './types';
import config from './config';

import { MenuTemplate } from '../../menu';

export default (): MenuTemplate => [
  {
    label: defaultMenuDownloadLabel,
    click: () => downloadPlaylist(),
  },
  {
    label: 'Choose download folder',
    click() {
      const result = dialog.showOpenDialogSync({
        properties: ['openDirectory', 'createDirectory'],
        defaultPath: getFolder(config.get('downloadFolder') ?? ''),
      });
      if (result) {
        config.set('downloadFolder', result[0]);
      } // Else = user pressed cancel
    },
  },
  {
    label: 'Presets',
    submenu: Object.keys(DefaultPresetList).map((preset) => ({
      label: preset,
      type: 'radio',
      checked: config.get('selectedPreset') === preset,
      click() {
        config.set('selectedPreset', preset);
      },
    })),
  },
  {
    label: 'Skip existing files',
    type: 'checkbox',
    checked: config.get('skipExisting'),
    click(item) {
      config.set('skipExisting', item.checked);
    },
  },
];
