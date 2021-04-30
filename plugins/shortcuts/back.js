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
	const shortcutOptions = {global, local};

	for (const optionType in shortcutOptions) {
		registerAllShortcuts(shortcutOptions[optionType], optionType);
	}

	function registerAllShortcuts(container, type) {
		for (const action in container) {
			if (!container[action]) {
				continue; //accelerator is empty
			}
	
			console.debug(`Registering ${type} shortcut`, container[action], ":", action);
			if (!songControls[action]) {
				console.warn("Invalid action", action);
				continue;
			}
	
			type === "global" ? 
			_registerGlobalShortcut(win.webContents, container[action], songControls[action]) :
			_registerLocalShortcut(win, local[action], songControls[action]);
		}
	}
}

/** Update options to new format */
function updateOptions(options) {
	let updated = false;
	for (const optionType of ["global", "local"]) {
		if (Array.isArray(options[optionType])) {
			const updatedOptions = {};
			for (const optionObject of options[optionType]) {
				if (optionObject.action && optionObject.shortcut) {
					updatedOptions[optionObject.action] = optionObject.shortcut;
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
