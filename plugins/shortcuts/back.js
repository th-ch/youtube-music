const { globalShortcut } = require("electron");
const electronLocalshortcut = require("electron-localshortcut");

const {
	playPause,
	nextTrack,
	previousTrack,
	startSearch
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
}

module.exports = registerShortcuts;
