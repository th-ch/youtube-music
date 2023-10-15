import path from 'node:path';

import { app, BrowserWindow, nativeImage } from 'electron';

import getSongControls from '../../providers/song-controls';
import registerCallback, { SongInfo } from '../../providers/song-info';
import { getMediaIconLocation, saveMediaIcon } from '../utils';

export default (win: BrowserWindow) => {
  let currentSongInfo: SongInfo;

  const { playPause, next, previous } = getSongControls(win);

  if (app.isPackaged) {
    saveMediaIcon();
  }

  const setThumbar = (win: BrowserWindow, songInfo: SongInfo) => {
    // Wait for song to start before setting thumbar
    if (!songInfo?.title) {
      return;
    }

    // Win32 require full rewrite of components
    win.setThumbarButtons([
      {
        tooltip: 'Previous',
        icon: nativeImage.createFromPath(get('previous')),
        click() {
          previous();
        },
      }, {
        tooltip: 'Play/Pause',
        // Update icon based on play state
        icon: nativeImage.createFromPath(songInfo.isPaused ? get('play') : get('pause')),
        click() {
          playPause();
        },
      }, {
        tooltip: 'Next',
        icon: nativeImage.createFromPath(get('next')),
        click() {
          next();
        },
      },
    ]);
  };

  // Util
  const get = (kind: string) => {
    return path.join(getMediaIconLocation(), `${kind}.png`);
  };

  registerCallback((songInfo) => {
    // Update currentsonginfo for win.on('show')
    currentSongInfo = songInfo;
    // Update thumbar
    setThumbar(win, songInfo);
  });

  // Need to set thumbar again after win.show
  win.on('show', () => {
    setThumbar(win, currentSongInfo);
  });
};
