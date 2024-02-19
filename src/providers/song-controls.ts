// This is used for to control the songs
import { BrowserWindow, ipcMain } from 'electron';

export default (win: BrowserWindow) => {
  const commands = {
    // Playback
    previous: () => win.webContents.send('ytmd:previous-video'),
    next: () => win.webContents.send('ytmd:next-video'),
    playPause: () => win.webContents.send('ytmd:toggle-play'),
    like: () => win.webContents.send('ytmd:update-like', 'LIKE'),
    dislike: () => win.webContents.send('ytmd:update-like', 'DISLIKE'),
    go10sBack: () => win.webContents.send('ytmd:seek-by', -10),
    go10sForward: () => win.webContents.send('ytmd:seek-by', 10),
    go1sBack: () => win.webContents.send('ytmd:seek-by', -1),
    go1sForward: () => win.webContents.send('ytmd:seek-by', 1),
    shuffle: () => win.webContents.send('ytmd:shuffle'),
    switchRepeat: (n = 1) => win.webContents.send('ytmd:switch-repeat', n),
    // General
    volumeMinus10: () => {
      ipcMain.once('ytmd:get-volume-return', (_, volume) => {
        win.webContents.send('ytmd:update-volume', volume - 10);
      });
      win.webContents.send('ytmd:get-volume');
    },
    volumePlus10: () => {
      ipcMain.once('ytmd:get-volume-return', (_, volume) => {
        win.webContents.send('ytmd:update-volume', volume + 10);
      });
      win.webContents.send('ytmd:get-volume');
    },
    fullscreen: () => win.webContents.send('ytmd:toggle-fullscreen'),
    muteUnmute: () => win.webContents.send('ytmd:toggle-mute'),
    search: () => win.webContents.sendInputEvent({
      type: 'keyDown',
      keyCode: '/',
    }),
  };
  return {
    ...commands,
    play: commands.playPause,
    pause: commands.playPause,
  };
};
