import style from './style.css?inline';
import { createPlugin } from '@/utils';
import { menuContent } from './menu';
import { onRendererLoad } from './renderer/renderer';
// import { t } from '@/i18n';

export type SyncedLyricsPluginConfig = {
  enabled: boolean;
  preciseTiming: boolean;
  showTimeCodes: boolean;
  defaultTextString: string;
  showLyricsEvenIfInexact: boolean;
  lineEffect: LineEffect;
};

export type LineLyricsStatus = 'previous' | 'current' | 'upcoming';

export type LineLyrics = {
  index: number;
  time: string;
  timeInMs: number;
  text: string;
  status: LineLyricsStatus
};

export type PlayPauseEvent = {
  isPaused: boolean;
  elapsedSeconds: number;
};

export type LineEffect = 'scale' | 'offset' | 'focus';

export default createPlugin({
  name: () => 'Synced Lyrics',
  description: () => 'Synced Lyrics Plugin Description',
  authors: ['Non0reo'],
  restartNeeded: true,
  addedVersion: '3.4.X',
  config: {
    enabled: false,
    preciseTiming: true,
    showLyricsEvenIfInexact: true,
    showTimeCodes: false,
    defaultTextString: '♪',
    lineEffect: 'scale',
  } as SyncedLyricsPluginConfig,
  stylesheets: [style],
  menu: menuContent,
  backend: {
    async start({ ipc }) {

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
  },
  renderer: onRendererLoad,
});

