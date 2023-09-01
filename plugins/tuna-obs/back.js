const { ipcMain, net } = require('electron');

const registerCallback = require('../../providers/song-info');

const secToMilisec = (t) => Math.round(Number(t) * 1e3);
const data = {
  cover: '',
  cover_url: '',
  title: '',
  artists: [],
  status: '',
  progress: 0,
  duration: 0,
  album_url: '',
  album: undefined,
};

const post = async (data) => {
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
  }).catch((error) => console.log(`Error: '${error.code || error.errno}' - when trying to access obs-tuna webserver at port ${port}`));
};

/** @param {Electron.BrowserWindow} win */
module.exports = async (win) => {
  ipcMain.on('apiLoaded', () => win.webContents.send('setupTimeChangedListener'));
  ipcMain.on('timeChanged', async (_, t) => {
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
    data.progress = secToMilisec(songInfo.elapsedSeconds);
    data.cover = songInfo.imageSrc;
    data.cover_url = songInfo.imageSrc;
    data.album_url = songInfo.imageSrc;
    data.title = songInfo.title;
    data.artists = [songInfo.artist];
    data.status = songInfo.isPaused ? 'stopped' : 'playing';
    data.album = songInfo.album;
    post(data);
  });
};
