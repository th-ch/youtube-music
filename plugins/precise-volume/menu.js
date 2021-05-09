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

async function promptVolumeSteps(win, options) {
	const promptOptions = setupPromptOptions({
		title: "Volume Steps",
		label: "Choose Volume Increase/Decrease Steps",
		value: options.steps || 1,
		type: "counter",
		counterOptions: { minimum: 0, maximum: 100, multiFire: true },
		width: 380
	});

	const output = await prompt(promptOptions, win)
	if (output || output === 0) { // 0 is somewhat valid
		options.steps = output;
		setOptions("precise-volume", options);
	}
}

async function promptGlobalShortcuts(win, options, item) {
	const promptOptions = setupPromptOptions({
		title: "Global Volume Keybinds",
		label: "Choose Global Volume Keybinds:",
		type: "keybind",
		keybindOptions: [
			kb("Increase Volume", "volumeUp", options.globalShortcuts?.volumeUp),
			kb("Decrease Volume", "volumeDown", options.globalShortcuts?.volumeDown)
		]
	});

	const output = await prompt(promptOptions, win)
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
}

function setupPromptOptions(options) {
	// TODO Custom titlebar needs testing on macOS
	if (is.macOS()) {
		return {
			...options,
			customStylesheet: "dark",
			icon: iconPath
		};
	} else {
		return {
			...options,
			customStylesheet: "dark",
			icon: iconPath,
			// The following are used for custom titlebar
			frame: false,
			customScript: customTitlebarPath,
			enableRemoteModule: true
		};
	}
}
