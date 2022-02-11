const { setMenuOptions } = require("../../config/plugins");
const prompt = require("custom-electron-prompt");
const promptOptions = require("../../providers/prompt-options");

module.exports = (win, options) => [
	{
		label: "Set Global Song Controls",
		click: () => promptKeybind(options, win)
	},
	{
		label: "Override MediaKeys",
		type: "checkbox",
		checked: options.overrideMediaKeys,
		click: item => setOption(options, "overrideMediaKeys", item.checked)
	}
];

function setOption(options, key = null, newValue = null) {
	if (key && newValue !== null) {
		options[key] = newValue;
	}

	setMenuOptions("shortcuts", options);
}

// Helper function for keybind prompt
const kb = (label_, value_, default_) => { return { value: value_, label: label_, default: default_ }; };

async function promptKeybind(options, win) {
	const output = await prompt({
		title: "Global Keybinds",
		label: "Choose Global Keybinds for Songs Control:",
		type: "keybind",
		keybindOptions: [ // If default=undefined then no default is used
			kb("Previous", "previous", options.global?.previous),
			kb("Play / Pause", "playPause", options.global?.playPause),
			kb("Next", "next", options.global?.next)
		],
		height: 270,
		...promptOptions()
	}, win);

	if (output) {
		if (!options.global) {
			options.global = {};
		}
		for (const { value, accelerator } of output) {
			options.global[value] = accelerator;
		}
		setOption(options);
	}
	// else -> pressed cancel
}
