const { setOptions } = require("../../config/plugins");
const prompt = require("custom-electron-prompt");
const path = require("path");
const is = require("electron-is");

function setOption(options, key = null, newValue = null) {
	if (key && newValue) {
		options[key] = newValue;
	}
	setOptions("shortcuts", options)
}

module.exports = (win, options) => [
	{
		label: "Set Global Song Controls",
		type: "checkbox",
		checked: true,
		click: () => promptKeybind(options, win)
	},
	{
		label: "Override MediaKeys",
		type: "checkbox",
		checked: options.overrideMediaKeys,
		click: (item) => setOption(options, "overrideMediaKeys", item.checked)
	}
];

function getGlobalKeybinds(options) {
	let playPause, next, previous;
	if (options.global) {
		for (const global of options.global) {
			switch (global.action) {
				case "playPause":
					playPause = global.shortcut;
					break;
				case "previous":
					previous = global.shortcut;
					break;
				case "next":
					next = global.shortcut;
			}
		}
	}
	return { playPause, next, previous };
}

function setGlobalKeybinds(options, newShortcuts) {
	let didSet = {};
	for (const shortcut in newShortcuts) {
		didSet[shortcut] = false;
	}
	if (!options.global) {
		options.global = [];
	}
	for (let i in options.global) {
		switch (options.global[i].action) {
			case "playPause":
				options.global[i].shortcut = newShortcuts.playPause;
				didSet["playPause"] = true;
				break;
			case "previous":
				options.global[i].shortcut = newShortcuts.previous;
				didSet["previous"] = true;
				break;
			case "next":
				options.global[i].shortcut = newShortcuts.next;
				didSet["next"] = true;
				break;
		}
	}
	for (const action in didSet) {
		if (!didSet[action]) {
			options.global.push({ action: action, shortcut: newShortcuts[action] });
		}
	}
	options.global.forEach((obj) => console.log(obj));
	setOption(options);
}

const kb = (label_, value_, default_) => { return { value: value_, label: label_, default: default_ || "" } };
const iconPath = path.join(process.cwd(), "assets", "youtube-music-tray.png");

function promptKeybind(options, win) {
	let globalKeybinds = getGlobalKeybinds(options);
	let promptOptions = {
		title: "Global Keybinds",
		icon: iconPath,
		label: "Choose Global Keybinds for Songs Control:",
		type: "keybind",
		keybindOptions: [
			kb("Previous", "previous", globalKeybinds.previous),
			kb("Play / Pause", "playPause", globalKeybinds.playPause),
			kb("Next", "next", globalKeybinds.next),
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
			let toSave = {};
			for (const keybindObj of output) {
				toSave[keybindObj.value] = keybindObj.accelerator;
			}
			setGlobalKeybinds(options, toSave);
		}
		//else = pressed cancel
	})
	.catch(console.error)
}