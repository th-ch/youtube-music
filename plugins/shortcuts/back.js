const { globalShortcut } = require("electron");
const electronLocalshortcut = require("electron-localshortcut");
const { setOptions } = require("../../config/plugins");

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

function registerShortcuts(win, options) {
	const songControls = getSongControls(win);
	const { playPause, next, previous, search } = songControls;

	updateOptions(options);

	if (options.overrideMediaKeys) {
		_registerGlobalShortcut(win.webContents, "MediaPlayPause", playPause);
		_registerGlobalShortcut(win.webContents, "MediaNextTrack", next);
		_registerGlobalShortcut(win.webContents, "MediaPreviousTrack", previous);
	}

	_registerLocalShortcut(win, "CommandOrControl+F", search);
	_registerLocalShortcut(win, "CommandOrControl+L", search);

	const { global, local } = options;

	if (global) {
		for (const action in global) {
			if (!global[action]) {
				return; //accelerator is empty
			}
			console.debug("Registering global shortcut", global[action], ":", action);
			if (!songControls[action]) {
				console.warn("Invalid action", action);
				return;
			}
			_registerGlobalShortcut(win.webContents, global[action], songControls[action]);
		}
	}

	if (local) {
		for (const action in local) {
			if (!local[action]) {
				return; //accelerator is empty
			}
			console.debug("Registering local shortcut", local[action], ":", action);
			if (!songControls[action]) {
				console.warn("Invalid action", action);
				return;
			}
			_registerLocalShortcut(win, local[action], songControls[action]);
		}
	}
}

/** Update options to new format */
function updateOptions(options) {
	let updated = false;
	for (const optionType of ["global", "local"]) {
		if (Array.isArray(options[optionType])) {
			const updatedOptions = {}
			for (const obj of options[optionType]) {
				if (obj.action && obj.shortcut) {
					updatedOptions[obj.action] = obj.shortcut;
				}
			}
			options[optionType] = updatedOptions;
			updated = true;
		}
	}
	if (updated) {
		setOptions("shortcuts", options);
	}
}

module.exports = registerShortcuts;
