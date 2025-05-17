/* eslint-disable stylistic/no-mixed-operators */
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

// --- Factored utilities ---
function buildDiscordButtons(
  config: DiscordPluginConfig,
  songInfo: SongInfo,
): GatewayActivityButton[] | undefined {
  const buttons: GatewayActivityButton[] = [];
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
  return buttons.length ? buttons : undefined;
}

function padHangulFields(songInfo: SongInfo): void {
  const hangulFiller = '\u3164';
  (['title', 'artist', 'album'] as (keyof SongInfo)[]).forEach((key) => {
    const value = songInfo[key];
    if (typeof value === 'string' && value.length < 2) {
      // @ts-expect-error: dynamic assignment for SongInfo fields
      songInfo[key] = value + hangulFiller.repeat(2 - value.length);
    }
  });
}

// Centralized timer management
const TimerManager = {
  timers: new Map<string, NodeJS.Timeout>(),
  set(key: string, fn: () => void, delay: number) {
    this.clear(key);
    this.timers.set(key, setTimeout(fn, delay));
  },
  clear(key: string) {
    const t = this.timers.get(key);
    if (t) clearTimeout(t);
    this.timers.delete(key);
  },
  clearAll() {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  },
};

// --- Centralization of Discord logic ---
interface DiscordState {
  rpc: DiscordClient;
  ready: boolean;
  autoReconnect: boolean;
  lastSongInfo?: SongInfo;
}
const discordState: DiscordState = {
  rpc: new DiscordClient({
    clientId,
  }),
  ready: false,
  autoReconnect: true,
  lastSongInfo: undefined,
};

let mainWindow: Electron.BrowserWindow;

let lastActivitySongId: string | null = null;
let lastPausedState: boolean = false;
let lastElapsedSeconds: number = 0;
let lastProgressUpdate: number = 0;
const PROGRESS_THROTTLE_MS = 15000;

function buildActivityInfo(
  songInfo: SongInfo,
  config: DiscordPluginConfig,
  pausedKey: 'smallImageKey' | 'largeImageKey' = 'smallImageKey',
): SetActivity {
  padHangulFields(songInfo);
  const activityInfo: SetActivity = {
    type: ActivityType.Listening,
    details: truncateString(songInfo.title, 128),
    state: truncateString(songInfo.artist, 128),
    largeImageKey: songInfo.imageSrc ?? '',
    largeImageText: songInfo.album ?? '',
    buttons: buildDiscordButtons(config, songInfo),
  };
  if (songInfo.isPaused) {
    activityInfo[pausedKey] = 'paused';
    if (pausedKey === 'smallImageKey') {
      activityInfo.smallImageText = 'Paused';
    } else {
      activityInfo.largeImageText = 'Paused';
    }
  } else if (!config.hideDurationLeft) {
    // Set start/end timestamps for progress bar
    const songStartTime = Date.now() - (songInfo.elapsedSeconds ?? 0) * 1000;
    activityInfo.startTimestamp = songStartTime;
    activityInfo.endTimestamp = songStartTime + songInfo.songDuration * 1000;
  }
  return activityInfo;
}

function updateDiscordRichPresence(
  songInfo: SongInfo,
  config: DiscordPluginConfig,
) {
  if (songInfo.title.length === 0 && songInfo.artist.length === 0) return;
  discordState.lastSongInfo = songInfo;
  TimerManager.clear('clearActivity');
  if (!discordState.rpc || !discordState.ready) return;
  const now = Date.now();
  const songChanged = songInfo.videoId !== lastActivitySongId;
  const pauseChanged = songInfo.isPaused !== lastPausedState;
  const seeked = isSeek(lastElapsedSeconds, songInfo.elapsedSeconds ?? 0);
  if (songChanged || pauseChanged || seeked) {
    TimerManager.clear('updateTimeout');
    const activityInfo = buildActivityInfo(
      songInfo,
      config,
      songInfo.isPaused ? 'largeImageKey' : 'smallImageKey',
    );
    discordState.rpc.user?.setActivity(activityInfo).catch(console.error);
    lastActivitySongId = songInfo.videoId;
    if (typeof songInfo.isPaused === 'boolean') {
      lastPausedState = songInfo.isPaused;
    }
    lastElapsedSeconds = songInfo.elapsedSeconds ?? 0;
    lastProgressUpdate = now;
    setActivityTimeoutCentral(songInfo.isPaused, config);
    return;
  }
  if (now - lastProgressUpdate > PROGRESS_THROTTLE_MS) {
    const activityInfo = buildActivityInfo(
      songInfo,
      config,
      songInfo.isPaused ? 'largeImageKey' : 'smallImageKey',
    );
    discordState.rpc.user?.setActivity(activityInfo).catch(console.error);
    lastProgressUpdate = now;
    lastElapsedSeconds = songInfo.elapsedSeconds ?? 0;
    setActivityTimeoutCentral(songInfo.isPaused, config);
  } else {
    TimerManager.clear('updateTimeout');
    const songInfoSnapshot = { ...songInfo };
    TimerManager.set(
      'updateTimeout',
      () => {
        if (
          discordState.lastSongInfo?.videoId === songInfoSnapshot.videoId &&
          discordState.lastSongInfo?.isPaused === songInfoSnapshot.isPaused
        ) {
          const activityInfo = buildActivityInfo(songInfoSnapshot, config);
          discordState.rpc.user?.setActivity(activityInfo).catch(console.error);
          lastProgressUpdate = Date.now();
          lastElapsedSeconds = songInfoSnapshot.elapsedSeconds ?? 0;
          setActivityTimeoutCentral(songInfoSnapshot.isPaused, config);
        }
      },
      PROGRESS_THROTTLE_MS - (now - lastProgressUpdate),
    );
  }
}

/**
 * Sets a timer to clear Discord activity if paused for too long.
 * Uses TimerManager to ensure only one clear-activity timer is active at a time.
 */
function setActivityTimeoutCentral(
  isPaused: boolean | undefined,
  config: DiscordPluginConfig,
) {
  TimerManager.clear('clearActivity');
  if (isPaused === true && config.activityTimeoutEnabled) {
    TimerManager.set(
      'clearActivity',
      () => {
        discordState.rpc.user?.clearActivity().catch(console.error);
      },
      config.activityTimeoutTime ?? 10_000,
    );
  }
}

const truncateString = (str: string, length: number): string => {
  if (str.length > length) return `${str.substring(0, length - 3)}...`;
  return str;
};

const resetInfo = () => {
  discordState.ready = false;
  TimerManager.clearAll();
  if (dev()) {
    console.log(LoggerPrefix, t('plugins.discord.backend.disconnected'));
  }
};

const connectTimeout = () =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      if (!discordState.autoReconnect || discordState.rpc.isConnected) {
        return;
      }

      discordState.rpc.login().then(resolve).catch(reject);
    }, 5000),
  );
const connectRecursive = () => {
  if (!discordState.autoReconnect || discordState.rpc.isConnected) {
    return;
  }

  connectTimeout().catch(connectRecursive);
};

export const connect = (showError = false) => {
  if (discordState.rpc.isConnected) {
    if (dev()) {
      console.log(LoggerPrefix, t('plugins.discord.backend.already-connected'));
    }

    return;
  }

  discordState.ready = false;

  // Startup the rpc client
  discordState.rpc.login().catch((error: Error) => {
    resetInfo();
    if (dev()) {
      console.error(error);
    }

    if (discordState.autoReconnect) {
      connectRecursive();
    } else if (showError) {
      dialog.showMessageBox(mainWindow, {
        title: 'Connection failed',
        message: error.message || String(error),
        type: 'error',
      });
    }
  });
};

export const clear = () => {
  if (discordState.rpc) {
    discordState.rpc.user?.clearActivity();
  }

  TimerManager.clearAll();
};

export const registerRefresh = (cb: () => void) => refreshCallbacks.push(cb);
export const isConnected = () => discordState.rpc?.isConnected;

const refreshCallbacks: (() => void)[] = [];

function isSeek(oldSec: number, newSec: number) {
  return Math.abs(newSec - oldSec) > 2;
}

export const backend = createBackend<
  {
    config?: DiscordPluginConfig;
    updateActivity: (songInfo: SongInfo, config: DiscordPluginConfig) => void;
  },
  DiscordPluginConfig
>({
  updateActivity: (songInfo, config) =>
    updateDiscordRichPresence(songInfo, config),

  async start(ctx) {
    this.config = await ctx.getConfig();

    discordState.rpc.on('connected', () => {
      if (dev()) {
        console.log(LoggerPrefix, t('plugins.discord.backend.connected'));
      }

      for (const cb of refreshCallbacks) {
        cb();
      }
    });

    discordState.rpc.on('ready', () => {
      discordState.ready = true;
      if (discordState.lastSongInfo && this.config) {
        this.updateActivity(discordState.lastSongInfo, this.config);
      }
    });

    discordState.rpc.on('disconnected', () => {
      resetInfo();

      if (discordState.autoReconnect) {
        connectTimeout();
      }
    });

    discordState.autoReconnect = this.config.autoReconnect;

    mainWindow = ctx.window;

    // If the page is ready, register the callback
    ctx.window.once('ready-to-show', () => {
      let lastSent = Date.now();
      registerCallback((songInfo, event) => {
        if (event !== SongInfoEvent.TimeChanged) {
          discordState.lastSongInfo = songInfo;
          if (this.config) this.updateActivity(songInfo, this.config);
        } else {
          const currentTime = Date.now();
          // if lastSent is more than 5 seconds ago, send the new time
          if (currentTime - lastSent > 5000) {
            lastSent = currentTime;
            if (songInfo) {
              discordState.lastSongInfo = songInfo;
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
    discordState.autoReconnect = newConfig.autoReconnect;
    if (discordState.lastSongInfo) {
      this.updateActivity(discordState.lastSongInfo, newConfig);
    }
  },
});
