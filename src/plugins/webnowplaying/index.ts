import { net } from 'electron';

import is from 'electron-is';

import { createPlugin } from '@/utils';
import registerCallback from '@/providers/song-info';
import { t } from '@/i18n';

import { WebSocket } from 'ws';

import ReconnectingWebSocket from 'reconnecting-websocket';

import type { RepeatMode } from '@/types/datahost-get-state';

interface Data {
  player: string;
  state: 'PLAYING' | 'PAUSED' | 'STOPPED';
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: string;
  position: string;
  volume: number;
  rating: number;
  repeat: 'ALL' | 'ONE' | 'NONE';
  shuffle: boolean;
}

export default createPlugin({
  name: () => t('plugins.webnowplaying.name'),
  description: () => t('plugins.webnowplaying.description'),
  restartNeeded: true,
  config: {
    enabled: false,
  },
  backend: {
    liteMode: false,
    data: {
      player: 'YouTube Music',
      state: 'STOPPED',
      title: '',
      artist: '',
      album: '',
      cover: '',
      duration: '0:00',
      // position and volume are fetched in sendUpdate()
      position: '0:00',
      volume: 100,
      rating: 0,
      repeat: 'NONE',
      shuffle: false
    } as Data,
    start({ ipc }) {
      const timeInSecondsToString = (timeInSeconds: number) => {
        const timeInMinutes = Math.floor(timeInSeconds / 60);
        if (timeInMinutes < 60) return `${timeInMinutes}:${Math.floor(timeInSeconds % 60).toString().padStart(2, '0')}`;

        return `${Math.floor(timeInMinutes / 60)}:${Math.floor(timeInMinutes % 60).toString().padStart(2, '0')}:${Math.floor(timeInSeconds % 60).toString().padStart(2, '0')}`;
      };

      const ws = new ReconnectingWebSocket('ws://localhost:8974', undefined, {
        WebSocket: WebSocket,
        maxEnqueuedMessages: 0,
      });
      ws.onmessage = () => {

      };

      const post = (data: Data) => {
        const port = 1608;
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Origin': '*',
        };
        const url = `http://127.0.0.1:${port}/`;
        net
          .fetch(url, {
            method: this.liteMode ? 'OPTIONS' : 'POST',
            headers,
            keepalive: true,
            body: this.liteMode ? undefined : JSON.stringify({ data }),
          })
          .then(() => {
            if (this.liteMode) {
              this.liteMode = false;
              console.debug(
                `obs-tuna webserver at port ${port} is now accessible. disable lite mode`,
              );
              post(data);
            }
          })
          .catch((error: { code: number; errno: number }) => {
            if (!this.liteMode && is.dev()) {
              console.debug(
                `Error: '${
                  error.code || error.errno
                }' - when trying to access obs-tuna webserver at port ${port}. enable lite mode`,
              );
              this.liteMode = true;
            }
          });
      };

      ipc.on('ytmd:player-api-loaded', () => {
        ipc.send('ytmd:setup-time-changed-listener');
        ipc.send('ytmd:setup-repeat-changed-listener');
        ipc.send('ytmd:setup-volume-changed-listener');
      });
      ipc.on('ytmd:time-changed', (t: number) => {
        if (!this.data.title) {
          return;
        }

        this.data.position = timeInSecondsToString(t);
        post(this.data);
      });
      ipc.on('ytmd:repeat-changed', (mode: RepeatMode) => {
        this.data.repeat = mode;
        post(this.data);
      });
      ipc.on('ytmd:volume-changed', (newVolume: number) => {
        this.data.volume = newVolume;
        post(this.data);
      });

      registerCallback((songInfo) => {
        if (!songInfo.title && !songInfo.artist) {
          return;
        }

        this.data.duration = timeInSecondsToString(songInfo.songDuration);
        this.data.position = timeInSecondsToString(songInfo.elapsedSeconds ?? 0);
        this.data.cover = songInfo.imageSrc ?? '';
        this.data.title = songInfo.title;
        this.data.artist = songInfo.artist;
        this.data.state = songInfo.isPaused ? 'PAUSED' : 'PLAYING';
        this.data.album = songInfo.album ?? '';
        post(this.data);
      });
    },
  },
});
