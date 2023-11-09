import { ipcMain, net, BrowserWindow } from 'electron';
import is from 'electron-is';

import registerCallback from '../../providers/song-info';

const secToMilisec = (t: number) => Math.round(Number(t) * 1e3);

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

const data: Data = {
  cover: '',
  cover_url: '',
  title: '',
  artists: [] as string[],
  status: '',
  progress: 0,
  duration: 0,
  album_url: '',
  album: undefined,
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
  net.fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  }).catch((error: { code: number, errno: number }) => {
    if (is.dev()) {
      console.debug(`Error: '${error.code || error.errno}' - when trying to access obs-tuna webserver at port ${port}`);
    }
  });
};

export default (win: BrowserWindow) => {
  ipcMain.on('apiLoaded', () => win.webContents.send('setupTimeChangedListener'));
  ipcMain.on('timeChanged', (_, t: number) => {
    if (!data.title) {
      return;
    }

    data.progress = secToMilisec(t);
    post(data);
  });

  registerCallback((songInfo) => {
    if (!songInfo.title && !songInfo.artist) {
      return;
    }

    data.duration = secToMilisec(songInfo.songDuration);
    data.progress = secToMilisec(songInfo.elapsedSeconds ?? 0);
    data.cover = songInfo.imageSrc ?? '';
    data.cover_url = songInfo.imageSrc ?? '';
    data.album_url = songInfo.imageSrc ?? '';
    data.title = songInfo.title;
    data.artists = [songInfo.artist];
    data.status = songInfo.isPaused ? 'stopped' : 'playing';
    data.album = songInfo.album;
    post(data);
  });
};
