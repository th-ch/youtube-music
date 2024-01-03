// This is used for to control the songs
import { BrowserWindow, ipcMain } from 'electron';

export default (win: BrowserWindow) => {
  const commands = {
      // Playback
      previous: () => win.webContents.send('previous-video'),
      next: () => win.webContents.send('next-video'),
      playPause: () => win.webContents.send('toggle-play'),
      like: () => win.webContents.send('update-like', 'LIKE'),
      dislike: () => win.webContents.send('update-like', 'DISLIKE'),
      go10sBack: () => win.webContents.send('seekBy', -10),
      go10sForward: () => win.webContents.send('seekBy', 10),
      go1sBack: () => win.webContents.send('seekBy', -1),
      go1sForward: () => win.webContents.send('seekBy', 1),
      shuffle: () => win.webContents.send('shuffle'),
      switchRepeat: (n = 1) => win.webContents.send('switch-repeat', n),
      // General
      volumeMinus10: () => {
        ipcMain.once('get-volume-return', (_, volume) => {
          win.webContents.send('update-volume', volume - 10);
        });
        win.webContents.send('get-volume');
      },
      volumePlus10: () => {
        ipcMain.once('get-volume-return', (_, volume) => {
          win.webContents.send('update-volume', volume + 10);
        });
        win.webContents.send('get-volume');
      },
      fullscreen: () => win.webContents.send('toggle-fullscreen'),
      muteUnmute: () => win.webContents.send('toggle-mute'),
  };
  return {
    ...commands,
    play: commands.playPause,
    pause: commands.playPause,
  };
};
