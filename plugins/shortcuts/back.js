const { globalShortcut } = require("electron");
const is = require("electron-is");
const electronLocalshortcut = require("electron-localshortcut");
const getSongControls = require("../../providers/song-controls");
const { setupMPRIS } = require("./mpris");
const registerCallback = require("../../providers/song-info");

let player;

function _registerGlobalShortcut(webContents, shortcut, action) {
	globalShortcut.register(shortcut, () => {
		action(webContents);
	});
}

function _registerLocalShortcut(win, shortcut, action) {
	electronLocalshortcut.register(win, shortcut, () => {
		action(win.webContents);
	});
}

function registerShortcuts(win, options) {
	const songControls = getSongControls(win);
	const { playPause, next, previous, search } = songControls;

	_registerGlobalShortcut(win.webContents, "MediaPlayPause", playPause);
	_registerGlobalShortcut(win.webContents, "MediaNextTrack", next);
	_registerGlobalShortcut(win.webContents, "MediaPreviousTrack", previous);
	_registerLocalShortcut(win, "CommandOrControl+F", search);
	_registerLocalShortcut(win, "CommandOrControl+L", search);
	registerCallback(songInfo => {
		if (player) {
			player.metadata = {
				'mpris:length': songInfo.songDuration * 60 * 1000 * 1000, // In microseconds
				'mpris:artUrl': songInfo.imageSrc,
				'xesam:title': songInfo.title,
				'xesam:artist': songInfo.artist
			};
			if (!songInfo.isPaused) {
				player.playbackStatus = "Playing"
			}
		}
	}
	)

	if (is.linux()) {
		try {
			const MPRISPlayer = setupMPRIS();

			MPRISPlayer.on("raise", () => {
				win.setSkipTaskbar(false);
				win.show();
			});
			MPRISPlayer.on("play", () => {
				if (MPRISPlayer.playbackStatus !== 'Playing') {
					MPRISPlayer.playbackStatus = 'Playing';
					playPause()
				}
			});
			MPRISPlayer.on("pause", () => {
				if (MPRISPlayer.playbackStatus !== 'Paused') {
					MPRISPlayer.playbackStatus = 'Paused';
					playPause()
				}
			});
			MPRISPlayer.on("next", () => {
				next()
			});
			MPRISPlayer.on("previous", () => {
				previous()
			});

			player = MPRISPlayer

		} catch (e) {
			console.warn("Error in MPRIS", e);
		}
	}

	const { global, local } = options;
	(global || []).forEach(({ shortcut, action }) => {
		console.debug("Registering global shortcut", shortcut, ":", action);
		if (!action || !songControls[action]) {
			console.warn("Invalid action", action);
			return;
		}

		_registerGlobalShortcut(win.webContents, shortcut, songControls[action]);
	});
	(local || []).forEach(({ shortcut, action }) => {
		console.debug("Registering local shortcut", shortcut, ":", action);
		if (!action || !songControls[action]) {
			console.warn("Invalid action", action);
			return;
		}

		_registerLocalShortcut(win, shortcut, songControls[action]);
	});
}

module.exports = registerShortcuts;
