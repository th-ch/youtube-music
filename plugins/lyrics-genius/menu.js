const prompt = require("custom-electron-prompt");

const { setMenuOptions } = require("../../config/plugins");
const promptOptions = require("../../providers/prompt-options");
const { clear, connect, registerRefresh, isConnected } = require("./back");

module.exports = (win, options) => {

	return [
		{
			label: "Romanized Lyrics",
			type: "checkbox",
			checked: false,
			click: () => {
				options.romanizedLyrics = item.checked;
				setMenuOptions('lyrics-genius', options);
			}
		},
		// Stole menu from Discord plugin oopsies
		// {
		// 	label: "Auto reconnect",
		// 	type: "checkbox",
		// 	checked: options.autoReconnect,
		// 	click: (item) => {
		// 		options.autoReconnect = item.checked;
		// 		setMenuOptions('discord', options);
		// 	},
		// },
		// {
		// 	label: "Clear activity",
		// 	click: clear,
		// },
		// {
		// 	label: "Clear activity after timeout",
		// 	type: "checkbox",
		// 	checked: options.activityTimoutEnabled,
		// 	click: (item) => {
		// 		options.activityTimoutEnabled = item.checked;
		// 		setMenuOptions('discord', options);
		// 	},
		// },
	];
};