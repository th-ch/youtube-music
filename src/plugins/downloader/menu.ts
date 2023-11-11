import { dialog } from 'electron';

import { downloadPlaylist } from './main';
import { defaultMenuDownloadLabel, getFolder } from './main/utils';
import { DefaultPresetList } from './types';

import builder from './index';

export default builder.createMenu(async ({ getConfig, setConfig }) => {
  const config = await getConfig();

  return [
    {
      label: defaultMenuDownloadLabel,
      click: () => downloadPlaylist(),
    },
    {
      label: 'Choose download folder',
      click() {
        const result = dialog.showOpenDialogSync({
          properties: ['openDirectory', 'createDirectory'],
          defaultPath: getFolder(config.downloadFolder ?? ''),
        });
        if (result) {
          setConfig({ downloadFolder: result[0] });
        } // Else = user pressed cancel
      },
    },
    {
      label: 'Presets',
      submenu: Object.keys(DefaultPresetList).map((preset) => ({
        label: preset,
        type: 'radio',
        checked: config.selectedPreset === preset,
        click() {
          setConfig({ selectedPreset: preset });
        },
      })),
    },
    {
      label: 'Skip existing files',
      type: 'checkbox',
      checked: config.skipExisting,
      click(item) {
        setConfig({ skipExisting: item.checked });
      },
    },
  ];
});
