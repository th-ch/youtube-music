const { enabled } = require("./back");
const { app } = require("electron");
const { setOptions } = require("../../config/plugins");
const prompt = require("custom-electron-prompt");
const path = require("path");
const is = require("electron-is");

module.exports = (win, options) => [
	{
		label: "Local Arrowkeys Controls",
		type: "checkbox",
		checked: !!options.arrowsShortcut,
		click: item => {
			// Dynamically change setting if plugin is enabled
			if (enabled()) {
				win.webContents.send("setArrowsShortcut", item.checked);
			} else { // Fallback to usual method if disabled
				options.arrowsShortcut = item.checked;
				setOptions("precise-volume", options);
			}
		}
	},
	{
		label: "Global Hotkeys",
		type: "checkbox",
		checked: !!options.globalShortcuts.volumeUp || !!options.globalShortcuts.volumeDown,
		click: item => promptGlobalShortcuts(win, options, item)
	},
	{
		label: "Set Custom Volume Steps",
		click: () => promptVolumeSteps(win, options)
	}
];

const iconPath = path.join(app.getAppPath(), "assets", "youtube-music-tray.png");
const customTitlebarPath = path.join(app.getAppPath(), "plugins", "in-app-menu", "prompt-custom-titlebar.js");
// Helper function for globalShortcuts prompt
const kb = (label_, value_, default_) => { return { value: value_, label: label_, default: default_ || undefined }; };

function setupPromptOptions(options) {
	// TODO Custom titlebar needs testing on macOS
	if (is.macOS()) {
		Object.assign(options, {
			customStylesheet: "dark",
			icon: iconPath
		});
	} else {
		Object.assign(options, {
			customStylesheet: "dark",
			icon: iconPath,
			// The following are used for custom titlebar
			frame: false,
			customScript: customTitlebarPath,
			enableRemoteModule: true
		});
	}
}

function promptVolumeSteps(win, options) {
	const promptOptions = {
		title: "Volume Steps",
		label: "Choose Volume Increase/Decrease Steps",
		value: options.steps || 1,
		type: "counter",
		counterOptions: { minimum: 0, maximum: 100, multiFire: true }
	};

	setupPromptOptions(promptOptions);

	prompt(promptOptions, win).then(input => {
		if (input || input === 0) { // 0 is somehow valid
			options.steps = input;
			setOptions("precise-volume", options);
		}
	}).catch(console.error);
}

function promptGlobalShortcuts(win, options, item) {
	const promptOptions = {
		title: "Global Volume Keybinds",
		label: "Choose Global Volume Keybinds:",
		type: "keybind",
		keybindOptions: [
			kb("Increase Volume", "volumeUp", options.globalShortcuts?.volumeUp),
			kb("Decrease Volume", "volumeDown", options.globalShortcuts?.volumeDown)
		],
		height: 230
	};

	setupPromptOptions(promptOptions);

	prompt(promptOptions, win)
		.then(output => {
			if (output) {
				for (const keybindObject of output) {
					options.globalShortcuts[keybindObject.value] = keybindObject.accelerator;
				}

				setOptions("precise-volume", options);

				item.checked = !!options.globalShortcuts.volumeUp || !!options.globalShortcuts.volumeDown;
			} else {
				// Reset checkbox if prompt was canceled
				item.checked = !item.checked;
			}
		})
		.catch(console.error);
}
