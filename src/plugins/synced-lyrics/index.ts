import style from './style.css?inline';
import { createPlugin } from '@/utils';
import { t } from '@/i18n';

import { menu } from './menu';
import { renderer } from './renderer';

import type { SyncedLyricsPluginConfig } from './types';

export default createPlugin({
  name: () => t('plugins.synced-lyrics.name'),
  description: () => t('plugins.synced-lyrics.description'),
  authors: ['Non0reo', 'ArjixWasTaken'],
  restartNeeded: true,
  addedVersion: '3.5.X',
  config: {
    enabled: false,
    preciseTiming: true,
    showLyricsEvenIfInexact: true,
    showTimeCodes: false,
    defaultTextString: '♪',
    lineEffect: 'scale',
  } satisfies SyncedLyricsPluginConfig,

  menu,
  renderer,
  stylesheets: [style],
});
