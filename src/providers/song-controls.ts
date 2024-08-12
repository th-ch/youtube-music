// This is used for to control the songs
import { BrowserWindow } from 'electron';

// see protocol-handler.ts
type ArgsType<T> = T | string[] | undefined;

const parseNumberFromArgsType = (args: ArgsType<number>) => {
  if (typeof args === 'number') {
    return args;
  } else if (Array.isArray(args)) {
    return Number(args[0]);
  } else {
    return null;
  }
};

const parseBooleanFromArgsType = (args: ArgsType<boolean>) => {
  if (typeof args === 'boolean') {
    return args;
  } else if (Array.isArray(args)) {
    return args[0] === 'true';
  } else {
    return null;
  }
};

export default (win: BrowserWindow) => {
  return {
    // Playback
    previous: () => win.webContents.send('ytmd:previous-video'),
    next: () => win.webContents.send('ytmd:next-video'),
    play: () => win.webContents.send('ytmd:play'),
    pause: () => win.webContents.send('ytmd:pause'),
    playPause: () => win.webContents.send('ytmd:toggle-play'),
    like: () => win.webContents.send('ytmd:update-like', 'LIKE'),
    dislike: () => win.webContents.send('ytmd:update-like', 'DISLIKE'),
    goBack: (seconds: ArgsType<number>) => {
      const secondsNumber = parseNumberFromArgsType(seconds);
      if (secondsNumber !== null) {
        win.webContents.send('ytmd:seek-by', -secondsNumber);
      }
    },
    goForward: (seconds: ArgsType<number>) => {
      const secondsNumber = parseNumberFromArgsType(seconds);
      if (secondsNumber !== null) {
        win.webContents.send('ytmd:seek-by', seconds);
      }
    },
    shuffle: () => win.webContents.send('ytmd:shuffle'),
    switchRepeat: (n: ArgsType<number> = 1) => {
      const repeat = parseNumberFromArgsType(n);
      if (repeat !== null) {
        win.webContents.send('ytmd:switch-repeat', n);
      }
    },
    // General
    setVolume: (volume: ArgsType<number>) => {
      const volumeNumber = parseNumberFromArgsType(volume);
      if (volumeNumber !== null) {
        win.webContents.send('ytmd:update-volume', volume);
      }
    },
    setFullscreen: (isFullscreen: ArgsType<boolean>) => {
      const isFullscreenValue = parseBooleanFromArgsType(isFullscreen);
      if (isFullscreenValue !== null) {
        win.setFullScreen(isFullscreenValue);
        win.webContents.send('ytmd:click-fullscreen-button', isFullscreenValue);
      }
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
