import http from 'node:http';

import { BrowserWindow, ipcMain } from 'electron';
import is from 'electron-is';

import registerCallback, { SongInfo } from '../../providers/song-info';
import getSongControls from '../../providers/song-controls';
import { isEnabled } from '../../config/plugins';

const port = 9669; // Choose a port number

export default (win: BrowserWindow) => {
  let songInfo: (SongInfo & { loopStatus?: string, volume?: number }) | undefined;

  if (!is.linux() || (is.linux() && !isEnabled('shortcuts'))) {
    ipcMain.on('apiLoaded', () => {
      win.webContents.send('setupSeekedListener', 'webinterface');
      win.webContents.send('setupTimeChangedListener', 'webinterface');
      win.webContents.send('setupRepeatChangedListener', 'webinterface');
      win.webContents.send('setupVolumeChangedListener', 'webinterface');
    });
  }

  // updations
  ipcMain.on('seeked', (_, t: number) => {
    if (songInfo) {
      songInfo.elapsedSeconds = t;
    }
  });

  ipcMain.on('timeChanged', (_, t: number) => {
    if (songInfo) {
      songInfo.elapsedSeconds = t;
    }
  });

  ipcMain.on('repeatChanged', (_, mode: string) => {
    if (songInfo) {
      songInfo.loopStatus = mode;
    }
  });

  ipcMain.on('volumeChanged', (_, newVolume: number) => {
    if(songInfo) {
      songInfo.volume = newVolume;
    }
  });

  registerCallback((info) => songInfo = info as SongInfo & { loopStatus?: string, volume?: number });

  const doAction = (action: URLSearchParams) => {
    //actions
    const songControls = getSongControls(win);
    const { playPause, next, previous, volumeMinus10, volumePlus10, shuffle } = songControls;
    switch (action.get('action')) {
      case 'play':
      case 'pause':
      case 'playpause':
        if (songInfo) {
          songInfo.isPaused = !songInfo.isPaused;
        }
        playPause();
        break;
      case 'next':
        next();
        break;
      case 'previous':
        previous();
        break;
      case 'shuffle':
        shuffle();
        break;
      case 'looptoggle':
        songControls.switchRepeat(1);
        break;
      case 'volumeplus10':
        volumePlus10();
        break;
      case 'volumeminus10':
        volumeMinus10();
        break;
      case 'seek':
        console.log('seek', action.get('value'));
        win.webContents.send('seekTo', action.get('value'));
        break;
      default:
        throw Error(`web-interface: Requested action "${action.get('action')}" not found`);
    }
  };

  const server = http.createServer((req,res) => {
    if (req?.url?.slice(0,4) === '/api') {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.searchParams.has('action')) {
        console.log('webinterface: received and trying action ' + url.searchParams.get('action'));
        try {
          doAction(url.searchParams);
        } catch (e) {
          res.statusCode = 404;
          res.write(e);
          return;
        }
      }
      res.setHeader('Content-Type','application/json');
      res.write(JSON.stringify(songInfo));
    }
    res.end();
  });
  server.listen(port, () => {
    console.log(`web-interface API Server is running on port ${port}`);
  });
};
