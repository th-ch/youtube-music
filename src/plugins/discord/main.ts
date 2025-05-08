import { app, dialog } from 'electron';
import { Client as DiscordClient } from '@xhayper/discord-rpc';
import { dev } from 'electron-is';

import { ActivityType, GatewayActivityButton } from 'discord-api-types/v10';

import registerCallback, {
  type SongInfo,
  SongInfoEvent,
} from '@/providers/song-info';
import { createBackend, LoggerPrefix } from '@/utils';
import { t } from '@/i18n';

import type { SetActivity } from '@xhayper/discord-rpc/dist/structures/ClientUser';
import type { DiscordPluginConfig } from './index';

// Application ID registered by @th-ch/youtube-music dev team
const clientId = '1177081335727267940';

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

const truncateString = (str: string, length: number): string => {
  if (str.length > length)
    return `${str.substring(0, length - 3)}...`;
  return str;
}

const resetInfo = () => {
  info.ready = false;
  clearTimeout(clearActivity);
  if (dev()) {
    console.log(LoggerPrefix, t('plugins.discord.backend.disconnected'));
  }

  for (const cb of refreshCallbacks) {
    cb();
  }
};

const connectTimeout = () =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      if (!info.autoReconnect || info.rpc.isConnected) {
        return;
      }

      info.rpc.login().then(resolve).catch(reject);
    }, 5000),
  );
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
      console.log(LoggerPrefix, t('plugins.discord.backend.already-connected'));
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

export const clear = () => {
  if (info.rpc) {
    info.rpc.user?.clearActivity();
  }

  clearTimeout(clearActivity);
};

export const registerRefresh = (cb: () => void) => refreshCallbacks.push(cb);
export const isConnected = () => info.rpc?.isConnected;

let lastActivitySongId: string | null = null;
let lastPausedState: boolean | null = null;
let lastElapsedSeconds: number = 0;
let updateTimeout: NodeJS.Timeout | null = null;
let lastProgressUpdate: number = 0; // timestamp of the last throttled update

const PROGRESS_THROTTLE_MS = 15000; // 15s to respect Discord's rate limit

function isSeek(oldSec: number, newSec: number) {
  return Math.abs((newSec ?? 0) - (oldSec ?? 0)) > 2;
}

function sendActivityToDiscord(songInfo: SongInfo, config: DiscordPluginConfig) {
  if (songInfo.title.length === 0 && songInfo.artist.length === 0) {
    return;
  }
  info.lastSongInfo = songInfo;
  clearTimeout(clearActivity);
  if (!info.rpc || !info.ready) {
    return;
  }
  let buttons: GatewayActivityButton[] | undefined = [];
  if (config.playOnYouTubeMusic) {
    buttons.push({
      label: 'Play on YouTube Music',
      url: songInfo.url ?? 'https://music.youtube.com',
    });
  }
  if (!config.hideGitHubButton) {
    buttons.push({
      label: 'View App On GitHub',
      url: 'https://github.com/th-ch/youtube-music',
    });
  }
  if (buttons.length === 0) {
    buttons = undefined;
  }
  const activityInfo: SetActivity = {
    type: ActivityType.Listening,
    details: truncateString(songInfo.title, 128),
    state: truncateString(songInfo.artist, 128),
    largeImageKey: songInfo.imageSrc ?? '',
    largeImageText: songInfo.album ?? '',
    buttons,
  };
  if (songInfo.isPaused) {
    activityInfo.smallImageKey = 'paused';
    activityInfo.smallImageText = 'Paused';
    // No timestamps when paused
  } else if (!config.hideDurationLeft) {
    const songStartTime = Date.now() - (songInfo.elapsedSeconds ?? 0) * 1000;
    activityInfo.startTimestamp = songStartTime;
    activityInfo.endTimestamp = songStartTime + songInfo.songDuration * 1000;
  }
  info.rpc.user?.setActivity(activityInfo).catch(console.error);
}

export const backend = createBackend<
  {
    config?: DiscordPluginConfig;
    updateActivity: (songInfo: SongInfo, config: DiscordPluginConfig) => void;
  },
  DiscordPluginConfig
>({
  /**
   * We get multiple events
   * Next song: PAUSE(n), PAUSE(n+1), PLAY(n+1)
   * Skip time: PAUSE(N), PLAY(N)
   */
  updateActivity: (songInfo, config) => {
    if (songInfo.title.length === 0 && songInfo.artist.length === 0) {
      return;
    }
    info.lastSongInfo = songInfo;
    clearTimeout(clearActivity);
    if (!info.rpc || !info.ready) {
      return;
    }
    const now = Date.now();
    const songChanged = songInfo.videoId !== lastActivitySongId;
    const pauseChanged = songInfo.isPaused !== lastPausedState;
    const seeked = isSeek(lastElapsedSeconds, songInfo.elapsedSeconds ?? 0);
    if (songChanged || pauseChanged || seeked) {
      // Immediate update
      if (updateTimeout) clearTimeout(updateTimeout);
      updateTimeout = null;
      sendActivityToDiscord(songInfo, config);
      lastActivitySongId = songInfo.videoId;
      lastPausedState = songInfo.isPaused ?? null;
      lastElapsedSeconds = songInfo.elapsedSeconds ?? 0;
      lastProgressUpdate = now;
      return;
    }
    // Normal progression: throttle
    if (now - lastProgressUpdate > PROGRESS_THROTTLE_MS) {
      sendActivityToDiscord(songInfo, config);
      lastProgressUpdate = now;
      lastElapsedSeconds = songInfo.elapsedSeconds ?? 0;
    } else {
      if (updateTimeout) clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        sendActivityToDiscord(songInfo, config);
        lastProgressUpdate = Date.now();
        lastElapsedSeconds = songInfo.elapsedSeconds ?? 0;
      }, PROGRESS_THROTTLE_MS - (now - lastProgressUpdate));
    }
    if (songInfo.isPaused && config.activityTimeoutEnabled) {
      clearTimeout(clearActivity);
      clearActivity = setTimeout(
        () => info.rpc.user?.clearActivity().catch(console.error),
        config.activityTimeoutTime ?? 10_000,
      );
    } else {
      clearTimeout(clearActivity);
    }
  },
  async start(ctx) {
    this.config = await ctx.getConfig();

    info.rpc.on('connected', () => {
      if (dev()) {
        console.log(LoggerPrefix, t('plugins.discord.backend.connected'));
      }

      for (const cb of refreshCallbacks) {
        cb();
      }
    });

    info.rpc.on('ready', () => {
      info.ready = true;
      if (info.lastSongInfo && this.config) {
        this.updateActivity(info.lastSongInfo, this.config);
      }
    });

    info.rpc.on('disconnected', () => {
      resetInfo();

      if (info.autoReconnect) {
        connectTimeout();
      }
    });

    info.autoReconnect = this.config.autoReconnect;

    window = ctx.window;

    // If the page is ready, register the callback
    ctx.window.once('ready-to-show', () => {
      let lastSent = Date.now();
      registerCallback((songInfo, event) => {
        if (event !== SongInfoEvent.TimeChanged) {
          info.lastSongInfo = songInfo;
          if (this.config) this.updateActivity(songInfo, this.config);
        } else {
          const currentTime = Date.now();
          // if lastSent is more than 5 seconds ago, send the new time
          if (currentTime - lastSent > 5000) {
            lastSent = currentTime;
            if (songInfo) {
              info.lastSongInfo = songInfo;
              if (this.config) this.updateActivity(songInfo, this.config);
            }
          }
        }
      });
      connect();
    });
    ctx.ipc.on('ytmd:player-api-loaded', () =>
      ctx.ipc.send('ytmd:setup-time-changed-listener'),
    );
    app.on('window-all-closed', clear);
  },
  stop() {
    resetInfo();
  },
  onConfigChange(newConfig) {
    this.config = newConfig;
    info.autoReconnect = newConfig.autoReconnect;
    if (info.lastSongInfo) {
      this.updateActivity(info.lastSongInfo, newConfig);
    }
  },
});
