import { dialog } from 'electron';
import prompt from 'custom-electron-prompt';

import { downloadPlaylist } from './main';
import { getFolder } from './main/utils';
import { DefaultPresetList } from './types';

import { t } from '@/i18n';

import type { MenuContext } from '@/types/contexts';
import type { MenuTemplate } from '@/menu';

import type { DownloaderPluginConfig } from './index';
import promptOptions from '@/providers/prompt-options';

export const onMenu = async ({
  getConfig,
  setConfig,
}: MenuContext<DownloaderPluginConfig>): Promise<MenuTemplate> => {
  const config = await getConfig();

  return [
    {
      label: t('plugins.downloader.menu.download-finish-settings.label'),
      type: 'submenu',
      submenu: [
        {
          label: t(
            'plugins.downloader.menu.download-finish-settings.submenu.enabled',
          ),
          type: 'checkbox',
          checked: config.downloadOnFinish,
          click(item) {
            setConfig({ downloadOnFinish: item.checked });
          },
        },
        {
          type: 'separator',
        },
        {
          label: t('plugins.downloader.menu.choose-download-folder'),
          click() {
            const result = dialog.showOpenDialogSync({
              properties: ['openDirectory', 'createDirectory'],
              defaultPath: getFolder(config.downloadOnFinishFolder ?? ''),
            });
            if (result) {
              setConfig({ downloadOnFinishFolder: result[0] });
              config.downloadOnFinishFolder = result[0];
            }
          },
        },
        {
          label: t(
            'plugins.downloader.menu.download-finish-settings.submenu.mode',
          ),
          type: 'submenu',
          submenu: [
            {
              label: t(
                'plugins.downloader.menu.download-finish-settings.submenu.seconds',
              ),
              type: 'radio',
              checked: config.downloadOnFinishMode === 'seconds',
              click() {
                setConfig({ downloadOnFinishMode: 'seconds' });
              },
            },
            {
              label: t(
                'plugins.downloader.menu.download-finish-settings.submenu.percent',
              ),
              type: 'radio',
              checked: config.downloadOnFinishMode === 'percent',
              click() {
                setConfig({ downloadOnFinishMode: 'percent' });
              },
            },
          ],
        },
        {
          label: t(
            'plugins.downloader.menu.download-finish-settings.submenu.advanced',
          ),
          async click() {
            const res = await prompt({
              title: t(
                'plugins.downloader.menu.download-finish-settings.prompt.title',
              ),
              type: 'multiInput',
              multiInputOptions: [
                {
                  label: t(
                    'plugins.downloader.menu.download-finish-settings.prompt.last-seconds',
                  ),
                  inputAttrs: {
                    type: 'number',
                    required: true,
                    min: '0',
                    step: '1',
                  },
                  value: config.downloadOnFinishSeconds,
                },
                {
                  label: t(
                    'plugins.downloader.menu.download-finish-settings.prompt.last-percent',
                  ),
                  inputAttrs: {
                    type: 'number',
                    required: true,
                    min: '1',
                    max: '100',
                    step: '1',
                  },
                  value: config.downloadOnFinishPercent,
                },
              ],
              ...promptOptions(),
              height: 240,
              resizable: true,
            }).catch(console.error);

            console.log(res);

            if (!res) {
              return undefined;
            }

            config.downloadOnFinishSeconds = Number(res[0]);
            config.downloadOnFinishPercent = Number(res[1]);

            setConfig({
              downloadOnFinishSeconds: Number(res[0]),
              downloadOnFinishPercent: Number(res[1]),
            });
            return;
          },
        },
      ],
    },

    {
      label: t('plugins.downloader.menu.download-playlist'),
      click: () => downloadPlaylist(),
    },
    {
      label: t('plugins.downloader.menu.choose-download-folder'),
      click() {
        const result = dialog.showOpenDialogSync({
          properties: ['openDirectory', 'createDirectory'],
          defaultPath: getFolder(config.downloadFolder ?? ''),
        });
        if (result) {
          setConfig({ downloadFolder: result[0] });
          config.downloadFolder = result[0];
        } // Else = user pressed cancel
      },
    },
    {
      label: t('plugins.downloader.menu.presets'),
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
      label: t('plugins.downloader.menu.skip-existing'),
      type: 'checkbox',
      checked: config.skipExisting,
      click(item) {
        setConfig({ skipExisting: item.checked });
      },
    },
  ];
};
