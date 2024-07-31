import style from './style.css?inline';
import { createPlugin } from '@/utils';

import { SyncedLyricsPluginConfig } from './types';

import { menu } from './menu';
import { renderer } from './renderer';

import { t } from '@/i18n';

export default createPlugin({
  name: () => t('plugins.synced-lyrics.name'),
  description: () => t('plugins.synced-lyrics.description'),
  authors: ['Non0reo', 'ArjixWasTaken'],
  restartNeeded: true,
  addedVersion: '3.5.X',
  config: {
    preciseTiming: true,
    showLyricsEvenIfInexact: true,
    showTimeCodes: false,
    defaultTextString: '♪',
    lineEffect: 'scale',
  } as SyncedLyricsPluginConfig,

  menu,
  renderer,
  stylesheets: [style],
});
