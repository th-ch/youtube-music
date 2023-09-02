// This is used for to control the songs
import { BrowserWindow } from 'electron';

type Modifiers = (Electron.MouseInputEvent | Electron.MouseWheelInputEvent | Electron.KeyboardInputEvent)['modifiers'];
export const pressKey = (window: BrowserWindow, key: string, modifiers: Modifiers = []) => {
  window.webContents.sendInputEvent({
    type: 'keyDown',
    modifiers,
    keyCode: key,
  });
};

export default (win: BrowserWindow) => {
  const commands = {
    // Playback
    previous: () => pressKey(win, 'k'),
    next: () => pressKey(win, 'j'),
    playPause: () => pressKey(win, ';'),
    like: () => pressKey(win, '+'),
    dislike: () => pressKey(win, '_'),
    go10sBack: () => pressKey(win, 'h'),
    go10sForward: () => pressKey(win, 'l'),
    go1sBack: () => pressKey(win, 'h', ['shift']),
    go1sForward: () => pressKey(win, 'l', ['shift']),
    shuffle: () => pressKey(win, 's'),
    switchRepeat(n = 1) {
      for (let i = 0; i < n; i++) {
        pressKey(win, 'r');
      }
    },
    // General
    volumeMinus10: () => pressKey(win, '-'),
    volumePlus10: () => pressKey(win, '='),
    fullscreen: () => pressKey(win, 'f'),
    muteUnmute: () => pressKey(win, 'm'),
    maximizeMinimisePlayer: () => pressKey(win, 'q'),
    // Navigation
    goToHome() {
      pressKey(win, 'g');
      pressKey(win, 'h');
    },
    goToLibrary() {
      pressKey(win, 'g');
      pressKey(win, 'l');
    },
    goToSettings() {
      pressKey(win, 'g');
      pressKey(win, ',');
    },
    goToExplore() {
      pressKey(win, 'g');
      pressKey(win, 'e');
    },
    search: () => pressKey(win, '/'),
    showShortcuts: () => pressKey(win, '/', ['shift']),
  };
  return {
    ...commands,
    play: commands.playPause,
    pause: commands.playPause,
  };
};
