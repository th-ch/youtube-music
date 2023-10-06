import path from 'node:path';

import { BrowserWindow, nativeImage } from 'electron';

import getSongControls from '../../providers/song-controls';
import registerCallback, { SongInfo } from '../../providers/song-info';


let controls: {
  playPause: () => void;
  next: () => void;
  previous: () => void;
};
let currentSongInfo: SongInfo;

export default (win: BrowserWindow) => {
  const { playPause, next, previous } = getSongControls(win);
  controls = { playPause, next, previous };

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

function setThumbar(win: BrowserWindow, songInfo: SongInfo) {
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
        controls.previous();
      },
    }, {
      tooltip: 'Play/Pause',
      // Update icon based on play state
      icon: nativeImage.createFromPath(songInfo.isPaused ? get('play') : get('pause')),
      click() {
        controls.playPause();
      },
    }, {
      tooltip: 'Next',
      icon: nativeImage.createFromPath(get('next')),
      click() {
        controls.next();
      },
    },
  ]);
}

// Util
function get(kind: string) {
  return path.join(__dirname, '../../assets/media-icons-black', `${kind}.png`);
}
