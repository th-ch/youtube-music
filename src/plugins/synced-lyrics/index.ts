import style from './style.css?inline';
import { createPlugin } from '@/utils';
import { menuContent } from './menu';
import { onRendererLoad } from './renderer/renderer';
import { SyncedLyricsPluginConfig } from './types';
// import { t } from '@/i18n';

export default createPlugin({
  name: () => 'Synced Lyrics',
  description: () => 'Synced Lyrics Plugin Description',
  authors: ['Non0reo'],
  restartNeeded: true,
  addedVersion: '3.4.X',
  config: <SyncedLyricsPluginConfig>{
    preciseTiming: true,
    showLyricsEvenIfInexact: true,
    showTimeCodes: false,
    defaultTextString: '♪',
    lineEffect: 'scale',
  },
  stylesheets: [style],
  menu: menuContent,
  backend({ ipc }) {
    ipc.on('ytmd:player-api-loaded', () =>
      ipc.send('ytmd:setup-time-changed-listener'),
    );

    ipc.on('ytmd:time-changed', (t: number) => {
      ipc.send('synced-lyrics:setTime', t);
    });

    ipc.on('ytmd:play-or-paused', (data: object) => {
      ipc.send('synced-lyrics:paused', data);
    });
  },
  renderer: onRendererLoad,
});
