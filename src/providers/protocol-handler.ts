import path from 'node:path';

import { app, BrowserWindow } from 'electron';

import getSongControls from './song-controls';

export const APP_PROTOCOL = 'youtubemusic';

let protocolHandler:
  | ((cmd: string, args: string[] | undefined) => void)
  | undefined;

export function setupProtocolHandler(win: BrowserWindow) {
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(APP_PROTOCOL, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  } else {
    app.setAsDefaultProtocolClient(APP_PROTOCOL);
  }

  const songControls = getSongControls(win);

  protocolHandler = ((
    cmd: keyof typeof songControls,
    args: string[] | undefined = undefined,
  ) => {
    if (Object.keys(songControls).includes(cmd)) {
      songControls[cmd](args as never);
    }
  }) as (cmd: string) => void;
}

export function handleProtocol(cmd: string, args: string[] | undefined) {
  protocolHandler?.(cmd, args);
}

export function changeProtocolHandler(
  f: (cmd: string, args: string[] | undefined) => void,
) {
  protocolHandler = f;
}

export default {
  APP_PROTOCOL,
  setupProtocolHandler,
  handleProtocol,
  changeProtocolHandler,
};
