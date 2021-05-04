const { setOptions } = require("../../config/plugins");
const prompt = require("custom-electron-prompt");

const path = require("path");
const is = require("electron-is");

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

	setOptions("shortcuts", options);
}

const kb = (label_, value_, default_) => { return { value: value_, label: label_, default: default_ || undefined }; };
const iconPath = path.join(process.cwd(), "assets", "youtube-music-tray.png");

function promptKeybind(options, win) {
	let promptOptions = {
		title: "Global Keybinds",
		icon: iconPath,
		label: "Choose Global Keybinds for Songs Control:",
		type: "keybind",
		keybindOptions: [
			kb("Previous", "previous", options.global?.previous),
			kb("Play / Pause", "playPause", options.global?.playPause),
			kb("Next", "next", options.global?.next)
		],
		customStylesheet: "dark",
		height: 250
	};

	if (!is.macOS()) {
		Object.assign(promptOptions, {
			frame: false,
			customScript: path.join(process.cwd(), "plugins", "in-app-menu", "prompt-custom-titlebar.js"),
			enableRemoteModule: true,
			height: 270
		});
	}

	prompt(promptOptions, win)
		.then(output => {
			if (output) {
				for (const keybindObject of output) {
					options.global[keybindObject.value] = keybindObject.accelerator;
				}

				setOption(options);
			}
			// else -> pressed cancel
		})
		.catch(console.error);
}
