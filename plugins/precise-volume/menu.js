const { enabled } = require("./back");
const { setOptions } = require("../../config/plugins");
const prompt = require("custom-electron-prompt");
const promptOptions = require("../../providers/prompt-options");


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

// Helper function for globalShortcuts prompt
const kb = (label_, value_, default_) => { return { value: value_, label: label_, default: default_ || undefined }; };

async function promptVolumeSteps(win, options) {
	const output = await prompt({
		title: "Volume Steps",
		label: "Choose Volume Increase/Decrease Steps",
		value: options.steps || 1,
		type: "counter",
		counterOptions: { minimum: 0, maximum: 100, multiFire: true },
		width: 380,
		...promptOptions()
	}, win)

	if (output || output === 0) { // 0 is somewhat valid
		options.steps = output;
		setOptions("precise-volume", options);
	}
}

async function promptGlobalShortcuts(win, options, item) {
	const output = await prompt({
		title: "Global Volume Keybinds",
		label: "Choose Global Volume Keybinds:",
		type: "keybind",
		keybindOptions: [
			kb("Increase Volume", "volumeUp", options.globalShortcuts?.volumeUp),
			kb("Decrease Volume", "volumeDown", options.globalShortcuts?.volumeDown)
		],
		...promptOptions()
	}, win)

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
