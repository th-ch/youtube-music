const { globalShortcut } = require("electron");
const electronLocalshortcut = require("electron-localshortcut");

const getSongControls = require("../../providers/song-controls");

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
	const { playPause, next, previous, search } = getSongControls(win);

	_registerGlobalShortcut(win.webContents, "MediaPlayPause", playPause);
	_registerGlobalShortcut(win.webContents, "MediaNextTrack", next);
	_registerGlobalShortcut(win.webContents, "MediaPreviousTrack", previous);
	_registerLocalShortcut(win, "CommandOrControl+F", search);
	_registerLocalShortcut(win, "CommandOrControl+L", search);
}

module.exports = registerShortcuts;
