import { MenuItemConstructorOptions } from 'electron';

import { t } from '@/i18n';

import type { MenuContext } from '@/types/contexts';
import type { SyncedLyricsPluginConfig } from './types';

export const menu = async ({
  getConfig,
  setConfig,
}: MenuContext<SyncedLyricsPluginConfig>): Promise<
  MenuItemConstructorOptions[]
> => {
  const config = await getConfig();

  return [
    {
      label: t('plugins.synced-lyrics.menu.precise-timing.label'),
      toolTip: t('plugins.synced-lyrics.menu.precise-timing.tooltip'),
      type: 'checkbox',
      checked: config.preciseTiming,
      click(item) {
        setConfig({
          preciseTiming: item.checked,
        });
      },
    },
    {
      label: t('plugins.synced-lyrics.menu.line-effect.label'),
      toolTip: t('plugins.synced-lyrics.menu.line-effect.tooltip'),
      type: 'submenu',
      submenu: [
        {
          label: t(
            'plugins.synced-lyrics.menu.line-effect.submenu.scale.label',
          ),
          toolTip: t(
            'plugins.synced-lyrics.menu.line-effect.submenu.scale.tooltip',
          ),
          type: 'radio',
          checked: config.lineEffect === 'scale',
          click() {
            setConfig({
              lineEffect: 'scale',
            });
          },
        },
        {
          label: t(
            'plugins.synced-lyrics.menu.line-effect.submenu.offset.label',
          ),
          toolTip: t(
            'plugins.synced-lyrics.menu.line-effect.submenu.offset.tooltip',
          ),
          type: 'radio',
          checked: config.lineEffect === 'offset',
          click() {
            setConfig({
              lineEffect: 'offset',
            });
          },
        },
        {
          label: t(
            'plugins.synced-lyrics.menu.line-effect.submenu.focus.label',
          ),
          toolTip: t(
            'plugins.synced-lyrics.menu.line-effect.submenu.focus.tooltip',
          ),
          type: 'radio',
          checked: config.lineEffect === 'focus',
          click() {
            setConfig({
              lineEffect: 'focus',
            });
          },
        },
      ],
    },
    {
      label: t('plugins.synced-lyrics.menu.default-text-string.label'),
      toolTip: t('plugins.synced-lyrics.menu.default-text-string.tooltip'),
      type: 'submenu',
      submenu: [
        {
          label: '♪',
          type: 'radio',
          checked: config.defaultTextString === '♪',
          click() {
            setConfig({
              defaultTextString: '♪',
            });
          },
        },
        {
          label: '" "',
          type: 'radio',
          checked: config.defaultTextString === ' ',
          click() {
            setConfig({
              defaultTextString: ' ',
            });
          },
        },
        {
          label: '...',
          type: 'radio',
          checked: config.defaultTextString === '...',
          click() {
            setConfig({
              defaultTextString: '...',
            });
          },
        },
        {
          label: '———',
          type: 'radio',
          checked: config.defaultTextString === '———',
          click() {
            setConfig({
              defaultTextString: '———',
            });
          },
        },
      ],
    },
    {
      label: t('plugins.synced-lyrics.menu.show-time-codes.label'),
      toolTip: t('plugins.synced-lyrics.menu.show-time-codes.tooltip'),
      type: 'checkbox',
      checked: config.showTimeCodes,
      click(item) {
        setConfig({
          showTimeCodes: item.checked,
        });
      },
    },
    {
      label: t('plugins.synced-lyrics.menu.show-lyrics-even-if-inexact.label'),
      toolTip: t(
        'plugins.synced-lyrics.menu.show-lyrics-even-if-inexact.tooltip',
      ),
      type: 'checkbox',
      checked: config.showLyricsEvenIfInexact,
      click(item) {
        setConfig({
          showLyricsEvenIfInexact: item.checked,
        });
      },
    },
  ];
};
