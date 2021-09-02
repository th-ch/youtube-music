const { globalShortcut } = require("electron");
const is = require("electron-is");
const electronLocalshortcut = require("electron-localshortcut");

<<<<<<< HEAD
const { setupMPRIS } = require("./mpris");
const {
	playPause,
	nextTrack,
	previousTrack,
	startSearch,
} = require("./youtube.js");
=======
const getSongControls = require("../../providers/song-controls");
>>>>>>> fe0f213919084f9e0bd95ce626ec711fb522d436

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
