// This is used for to control the songs
import { BrowserWindow } from 'electron';

export default (win: BrowserWindow) => {
  return {
    // Playback
    previous: () => win.webContents.send('ytmd:previous-video'),
    next: () => win.webContents.send('ytmd:next-video'),
    playPause: () => win.webContents.send('ytmd:toggle-play'),
    like: () => win.webContents.send('ytmd:update-like', 'LIKE'),
    dislike: () => win.webContents.send('ytmd:update-like', 'DISLIKE'),
    goBack: (seconds: number) => win.webContents.send('ytmd:seek-by', -seconds),
    goForward: (seconds: number) => win.webContents.send('ytmd:seek-by', seconds),
    shuffle: () => win.webContents.send('ytmd:shuffle'),
    switchRepeat: (n = 1) => win.webContents.send('ytmd:switch-repeat', n),
    // General
    setVolume: (volume: number) => {
      win.webContents.send('ytmd:update-volume', volume);
    },
    setFullscreen: (isFullscreen: boolean) => {
      win.webContents.send('ytmd:set-fullscreen', isFullscreen);
    },
    requestFullscreenInformation: () => {
      win.webContents.send('ytmd:get-fullscreen');
    },
    requestQueueInformation: () => {
      win.webContents.send('ytmd:get-queue');
    },
    muteUnmute: () => win.webContents.send('ytmd:toggle-mute'),
    search: () => {
      win.webContents.sendInputEvent({
        type: 'keyDown',
        keyCode: '/',
      });
    },
  };
};
