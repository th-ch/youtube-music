'use strict';
const { dialog, app } = require('electron');
const Discord = require('@xhayper/discord-rpc');
const { dev } = require('electron-is');

const registerCallback = require('../../providers/song-info');

// Application ID registered by @Zo-Bro-23
const clientId = '1043858434585526382';

/**
 * @typedef {Object} Info
 * @property {import('@xhayper/discord-rpc').Client} rpc
 * @property {boolean} ready
 * @property {boolean} autoReconnect
 * @property {import('../../providers/song-info').SongInfo} lastSongInfo
 */
/**
 * @type {Info}
 */
const info = {
  rpc: new Discord.Client({
    clientId,
  }),
  ready: false,
  autoReconnect: true,
  lastSongInfo: null,
};

/**
 * @type {(() => void)[]}
 */
const refreshCallbacks = [];

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

let window;
const connect = (showError = false) => {
  if (info.rpc.isConnected) {
    if (dev()) {
      console.log('Attempted to connect with active connection');
    }

    return;
  }

  info.ready = false;

  // Startup the rpc client
  info.rpc.login({ clientId }).catch((error) => {
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

let clearActivity;
/**
 * @type {import('../../providers/song-info').songInfoCallback}
 */
let updateActivity;

module.exports = (win, { autoReconnect, activityTimoutEnabled, activityTimoutTime, listenAlong, hideDurationLeft }) => {
  info.autoReconnect = autoReconnect;

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
    if (songInfo.isPaused && activityTimoutEnabled && activityTimoutTime === 0) {
      info.rpc.user?.clearActivity().catch(console.error);
      return;
    }

    // Song information changed, so lets update the rich presence
    // @see https://discord.com/developers/docs/topics/gateway#activity-object
    // not all options are transfered through https://github.com/discordjs/RPC/blob/6f83d8d812c87cb7ae22064acd132600407d7d05/src/client.js#L518-530
    const activityInfo = {
      details: songInfo.title,
      state: songInfo.artist,
      largeImageKey: songInfo.imageSrc,
      largeImageText: songInfo.album,
      buttons: listenAlong ? [
        { label: 'Listen Along', url: songInfo.url },
      ] : undefined,
    };

    if (songInfo.isPaused) {
      // Add a paused icon to show that the song is paused
      activityInfo.smallImageKey = 'paused';
      activityInfo.smallImageText = 'Paused';
      // Set start the timer so the activity gets cleared after a while if enabled
      if (activityTimoutEnabled) {
        clearActivity = setTimeout(() => info.rpc.user?.clearActivity().catch(console.error), activityTimoutTime ?? 10_000);
      }
    } else if (!hideDurationLeft) {
      // Add the start and end time of the song
      const songStartTime = Date.now() - (songInfo.elapsedSeconds * 1000);
      activityInfo.startTimestamp = songStartTime;
      activityInfo.endTimestamp
        = songStartTime + (songInfo.songDuration * 1000);
    }

    info.rpc.user?.setActivity(activityInfo).catch(console.error);
  };

  // If the page is ready, register the callback
  win.once('ready-to-show', () => {
    registerCallback(updateActivity);
    connect();
  });
  app.on('window-all-closed', module.exports.clear);
};

module.exports.clear = () => {
  if (info.rpc) {
    info.rpc.user?.clearActivity();
  }

  clearTimeout(clearActivity);
};

module.exports.connect = connect;
module.exports.registerRefresh = (cb) => refreshCallbacks.push(cb);
module.exports.isConnected = () => info.rpc !== null;
