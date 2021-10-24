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

	if (options.overrideMediaKeys) {
		_registerGlobalShortcut(win.webContents, "MediaPlayPause", playPause);
		_registerGlobalShortcut(win.webContents, "MediaNextTrack", next);
		_registerGlobalShortcut(win.webContents, "MediaPreviousTrack", previous);
	}

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
	const shortcutOptions = { global, local };

	for (const optionType in shortcutOptions) {
		registerAllShortcuts(shortcutOptions[optionType], optionType);
	}

	function registerAllShortcuts(container, type) {
		for (const action in container) {
			if (!container[action]) {
				continue; // Action accelerator is empty
			}

			console.debug(`Registering ${type} shortcut`, container[action], ":", action);
			if (!songControls[action]) {
				console.warn("Invalid action", action);
				continue;
			}

			if (type === "global") {
				_registerGlobalShortcut(win.webContents, container[action], songControls[action]);
			} else { // type === "local"
				_registerLocalShortcut(win, local[action], songControls[action]);
			}
		}
	}
}

module.exports = registerShortcuts;
