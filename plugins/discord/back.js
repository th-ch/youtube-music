const Discord = require("discord-rpc");
const { dev } = require("electron-is");
const { dialog, app } = require("electron");

const registerCallback = require("../../providers/song-info");

// Application ID registered by @semvis123
const clientId = "790655993809338398";

/**
 * @typedef {Object} Info
 * @property {import('discord-rpc').Client} rpc
 * @property {boolean} ready
 * @property {import('../../providers/song-info').SongInfo} lastSongInfo
 */
/**
 * @type {Info}
 */
const info = {
	rpc: null,
	ready: false,
	lastSongInfo: null,
};
/**
 * @type {(() => void)[]}
 */
const refreshCallbacks = [];
const resetInfo = () => {
	info.rpc = null;
	info.ready = false;
	clearTimeout(clearActivity);
	if (dev()) console.log("discord disconnected");
	refreshCallbacks.forEach(cb => cb());
};

let window;
const connect = (showErr = false) => {
	if (info.rpc) {
		if (dev())
			console.log('Attempted to connect with active RPC object');
		return;
	}

	info.rpc = new Discord.Client({
		transport: "ipc",
	});
	info.ready = false;

	info.rpc.once("connected", () => {
		if (dev()) console.log("discord connected");
		refreshCallbacks.forEach(cb => cb());
	});
	info.rpc.once("ready", () => {
		info.ready = true;
		if (info.lastSongInfo) updateActivity(info.lastSongInfo)
	});
	info.rpc.once("disconnected", resetInfo);

	// Startup the rpc client
	info.rpc.login({ clientId }).catch(err => {
		resetInfo();
		if (dev()) console.error(err);
		if (showErr) dialog.showMessageBox(window, { title: 'Connection failed', message: err.message || String(err), type: 'error' });
	});
};

let clearActivity;
/**
 * @type {import('../../providers/song-info').songInfoCallback}
 */
let updateActivity;

module.exports = (win, { activityTimoutEnabled, activityTimoutTime, listenAlong }) => {
	window = win;
	// We get multiple events
	// Next song: PAUSE(n), PAUSE(n+1), PLAY(n+1)
	// Skip time: PAUSE(N), PLAY(N)
	updateActivity = songInfo => {
		if (songInfo.title.length === 0 && songInfo.artist.length === 0) {
			return;
		}
		info.lastSongInfo = songInfo;

		// stop the clear activity timout
		clearTimeout(clearActivity);

		// stop early if discord connection is not ready
		// do this after clearTimeout to avoid unexpected clears
		if (!info.rpc || !info.ready) {
			return;
		}

		// clear directly if timeout is 0
		if (songInfo.isPaused && activityTimoutEnabled && activityTimoutTime === 0) {
			info.rpc.clearActivity().catch(console.error);
			return;
		}

		// Song information changed, so lets update the rich presence
		// @see https://discord.com/developers/docs/topics/gateway#activity-object
		// not all options are transfered through https://github.com/discordjs/RPC/blob/6f83d8d812c87cb7ae22064acd132600407d7d05/src/client.js#L518-530
		const activityInfo = {
			type: 2, // Listening, addressed in https://github.com/discordjs/RPC/pull/149
			details: songInfo.title,
			state: songInfo.artist,
			largeImageKey: "logo",
			largeImageText: [
				songInfo.uploadDate,
				songInfo.views.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " views",
			].join(' || '),
			buttons: listenAlong ? [
				{ label: "Listen Along", url: songInfo.url },
			] : undefined,
		};

		if (songInfo.isPaused) {
			// Add an idle icon to show that the song is paused
			activityInfo.smallImageKey = "idle";
			activityInfo.smallImageText = "idle/paused";
			// Set start the timer so the activity gets cleared after a while if enabled
			if (activityTimoutEnabled)
				clearActivity = setTimeout(() => info.rpc.clearActivity().catch(console.error), activityTimoutTime ?? 10000);
		} else {
			// Add the start and end time of the song
			const songStartTime = Date.now() - songInfo.elapsedSeconds * 1000;
			activityInfo.startTimestamp = songStartTime;
			activityInfo.endTimestamp =
				songStartTime + songInfo.songDuration * 1000;
		}

		info.rpc.setActivity(activityInfo).catch(console.error);
	};

	// If the page is ready, register the callback
	win.once("ready-to-show", () => {
		registerCallback(updateActivity);
		connect();
	});
	app.on('window-all-closed', module.exports.clear)
};

module.exports.clear = () => {
	if (info.rpc) info.rpc.clearActivity();
	clearTimeout(clearActivity);
};
module.exports.connect = connect;
module.exports.registerRefresh = (cb) => refreshCallbacks.push(cb);
module.exports.isConnected = () => info.rpc !== null;
