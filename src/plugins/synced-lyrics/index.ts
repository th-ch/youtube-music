import style from './style.css?inline';
import { createPlugin } from '@/utils';

import { SyncedLyricsPluginConfig } from './types';

import { menu } from './menu';
import { renderer } from './renderer';

// import { t } from '@/i18n';

export default createPlugin({
  name: () => 'Synced Lyrics',
  description: () => 'Synced Lyrics Plugin Description',
  authors: ['Non0reo', 'ArjixWasTaken'],
  restartNeeded: true,
  addedVersion: '3.4.X',
  config: <SyncedLyricsPluginConfig>{
    preciseTiming: true,
    showLyricsEvenIfInexact: true,
    showTimeCodes: false,
    defaultTextString: '♪',
    lineEffect: 'scale',
  },

  menu,
  renderer,
  stylesheets: [style],
});
