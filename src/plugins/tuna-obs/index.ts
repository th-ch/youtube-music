import { net } from 'electron';

import is from 'electron-is';

import { createPlugin } from '@/utils';
import registerCallback from '@/providers/song-info';
import { t } from '@/i18n';

interface Data {
  album: string | null | undefined;
  album_url: string;
  artists: string[];
  cover: string;
  cover_url: string;
  duration: number;
  progress: number;
  status: string;
  title: string;
}

export default createPlugin({
  name: () => t('plugins.tuna-obs.name'),
  description: () => t('plugins.tuna-obs.description'),
  restartNeeded: true,
  config: {
    enabled: false,
  },
  backend: {
    liteMode: false,
    data: {
      cover: '',
      cover_url: '',
      title: '',
      artists: [] as string[],
      status: '',
      progress: 0,
      duration: 0,
      album_url: '',
      album: undefined,
    } as Data,
    start({ ipc }) {
      const secToMilisec = (t: number) => Math.round(Number(t) * 1e3);

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

      ipc.on('ytmd:player-api-loaded', () =>
        ipc.send('ytmd:setup-time-changed-listener'),
      );
      ipc.on('ytmd:time-changed', (t: number) => {
        if (!this.data.title) {
          return;
        }

        this.data.progress = secToMilisec(t);
        post(this.data);
      });

      registerCallback((songInfo) => {
        if (!songInfo.title && !songInfo.artist) {
          return;
        }

        this.data.duration = secToMilisec(songInfo.songDuration);
        this.data.progress = secToMilisec(songInfo.elapsedSeconds ?? 0);
        this.data.cover = songInfo.imageSrc ?? '';
        this.data.cover_url = songInfo.imageSrc ?? '';
        this.data.album_url = songInfo.imageSrc ?? '';
        this.data.title = songInfo.title;
        this.data.artists = [songInfo.artist];
        this.data.status = songInfo.isPaused ? 'stopped' : 'playing';
        this.data.album = songInfo.album;
        post(this.data);
      });
    },
  },
});
