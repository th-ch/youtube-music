import { app, dialog, ipcMain } from 'electron';
import { Client as DiscordClient } from '@xhayper/discord-rpc';
import { dev } from 'electron-is';

import { SetActivity } from '@xhayper/discord-rpc/dist/structures/ClientUser';

import registerCallback, { type SongInfoCallback, type SongInfo } from '../../providers/song-info';

import type { ConfigType } from '../../config/dynamic';

// Application ID registered by @Zo-Bro-23
const clientId = '1043858434585526382';

export interface Info {
  rpc: DiscordClient;
  ready: boolean;
  autoReconnect: boolean;
  lastSongInfo?: SongInfo;
}

const info: Info = {
  rpc: new DiscordClient({
    clientId,
  }),
  ready: false,
  autoReconnect: true,
  lastSongInfo: undefined,
};

/**
 * @type {(() => void)[]}
 */
const refreshCallbacks: (() => void)[] = [];

const resetInfo = () => {
  info.ready = false;
  clearTimeout(clearActivity);
  if (dev()) {
    console.log('discord disconnected');
  }

  for (const cb of refreshCallbacks) {
    cb();
  }
};

const connectTimeout = () => new Promise((resolve, reject) => setTimeout(() => {
  if (!info.autoReconnect || info.rpc.isConnected) {
    return;
  }

  info.rpc.login().then(resolve).catch(reject);
}, 5000));

const connectRecursive = () => {
  if (!info.autoReconnect || info.rpc.isConnected) {
    return;
  }

  connectTimeout().catch(connectRecursive);
};

let window: Electron.BrowserWindow;
export const connect = (showError = false) => {
  if (info.rpc.isConnected) {
    if (dev()) {
      console.log('Attempted to connect with active connection');
    }

    return;
  }

  info.ready = false;

  // Startup the rpc client
  info.rpc.login().catch((error: Error) => {
    resetInfo();
    if (dev()) {
      console.error(error);
    }

    if (info.autoReconnect) {
      connectRecursive();
    } else if (showError) {
      dialog.showMessageBox(window, {
        title: 'Connection failed',
        message: error.message || String(error),
        type: 'error',
      });
    }
  });
};

let clearActivity: NodeJS.Timeout | undefined;
let updateActivity: SongInfoCallback;

type DiscordOptions = ConfigType<'discord'>;

export default (
  win: Electron.BrowserWindow,
  options: DiscordOptions,
) => {
  info.rpc.on('connected', () => {
    if (dev()) {
      console.log('discord connected');
    }

    for (const cb of refreshCallbacks) {
      cb();
    }
  });

  info.rpc.on('ready', () => {
    info.ready = true;
    if (info.lastSongInfo) {
      updateActivity(info.lastSongInfo);
    }
  });

  info.rpc.on('disconnected', () => {
    resetInfo();

    if (info.autoReconnect) {
      connectTimeout();
    }
  });

  info.autoReconnect = options.autoReconnect;

  window = win;
  // We get multiple events
  // Next song: PAUSE(n), PAUSE(n+1), PLAY(n+1)
  // Skip time: PAUSE(N), PLAY(N)
  updateActivity = (songInfo) => {
    if (songInfo.title.length === 0 && songInfo.artist.length === 0) {
      return;
    }

    info.lastSongInfo = songInfo;

    // Stop the clear activity timout
    clearTimeout(clearActivity);

    // Stop early if discord connection is not ready
    // do this after clearTimeout to avoid unexpected clears
    if (!info.rpc || !info.ready) {
      return;
    }

    // Clear directly if timeout is 0
    if (songInfo.isPaused && options.activityTimoutEnabled && options.activityTimoutTime === 0) {
      info.rpc.user?.clearActivity().catch(console.error);
      return;
    }

    // Song information changed, so lets update the rich presence
    // @see https://discord.com/developers/docs/topics/gateway#activity-object
    // not all options are transfered through https://github.com/discordjs/RPC/blob/6f83d8d812c87cb7ae22064acd132600407d7d05/src/client.js#L518-530
    const hangulFillerUnicodeCharacter = '\u3164'; // This is an empty character
    if (songInfo.title.length < 2) {
      songInfo.title += hangulFillerUnicodeCharacter.repeat(2 - songInfo.title.length);
    }
    if (songInfo.artist.length < 2) {
      songInfo.artist += hangulFillerUnicodeCharacter.repeat(2 - songInfo.title.length);
    }

    const activityInfo: SetActivity = {
      details: songInfo.title,
      state: songInfo.artist,
      largeImageKey: songInfo.imageSrc ?? '',
      largeImageText: songInfo.album ?? '',
      buttons: [
        ...(options.listenAlong ? [{ label: 'Listen Along', url: songInfo.url ?? '' }] : []),
        ...(options.hideGitHubButton ? [] : [{ label: 'View App On GitHub', url: 'https://github.com/th-ch/youtube-music' }]),
      ],
    };

    if (songInfo.isPaused) {
      // Add a paused icon to show that the song is paused
      activityInfo.smallImageKey = 'paused';
      activityInfo.smallImageText = 'Paused';
      // Set start the timer so the activity gets cleared after a while if enabled
      if (options.activityTimoutEnabled) {
        clearActivity = setTimeout(() => info.rpc.user?.clearActivity().catch(console.error), options.activityTimoutTime ?? 10_000);
      }
    } else if (!options.hideDurationLeft) {
      // Add the start and end time of the song
      const songStartTime = Date.now() - ((songInfo.elapsedSeconds ?? 0) * 1000);
      activityInfo.startTimestamp = songStartTime;
      activityInfo.endTimestamp
        = songStartTime + (songInfo.songDuration * 1000);
    }

    info.rpc.user?.setActivity(activityInfo).catch(console.error);
  };

  // If the page is ready, register the callback
  win.once('ready-to-show', () => {
    let lastSongInfo: SongInfo;
    registerCallback((songInfo) => {
      lastSongInfo = songInfo;
      updateActivity(songInfo);
    });
    connect();
    let lastSent = Date.now();
    ipcMain.on('timeChanged', (_, t: number) => {
      const currentTime = Date.now();
      // if lastSent is more than 5 seconds ago, send the new time
      if (currentTime - lastSent > 5000) {
        lastSent = currentTime;
        lastSongInfo.elapsedSeconds = t;
        updateActivity(lastSongInfo);
      }
    });
  });
  app.on('window-all-closed', clear);
};

export const clear = () => {
  if (info.rpc) {
    info.rpc.user?.clearActivity();
  }

  clearTimeout(clearActivity);
};

export const registerRefresh = (cb: () => void) => refreshCallbacks.push(cb);
export const isConnected = () => info.rpc !== null;
