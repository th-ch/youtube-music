const { globalShortcut } = require("electron");
const is = require("electron-is");
const electronLocalshortcut = require("electron-localshortcut");

const { setupMPRIS } = require("./mpris");
const {
	playPause,
	nextTrack,
	previousTrack,
	startSearch,
} = require("./youtube.js");

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

function registerShortcuts(win) {
	_registerGlobalShortcut(win.webContents, "MediaPlayPause", playPause);
	_registerGlobalShortcut(win.webContents, "MediaNextTrack", nextTrack);
	_registerGlobalShortcut(win.webContents, "MediaPreviousTrack", previousTrack);
	_registerLocalShortcut(win, "CommandOrControl+F", startSearch);
	_registerLocalShortcut(win, "CommandOrControl+L", startSearch);

	if (is.linux()) {
		try {
			const player = setupMPRIS();

			player.on("raise", () => {
				win.setSkipTaskbar(false);
				win.show();
			});
			player.on("playpause", playPause);
			player.on("next", nextTrack);
			player.on("previous", previousTrack);
		} catch (e) {
			console.warn("Error in MPRIS", e);
		}
	}
}

module.exports = registerShortcuts;
