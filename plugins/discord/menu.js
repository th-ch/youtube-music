const { setOptions } = require("../../config/plugins");
const { edit } = require("../../config");
const { clear } = require("./back");

module.exports = (win, options) => [
	{
		label: "Clear activity",
		click: () => {
			clear();
		},
	},
	{
		label: "Clear activity after timeout",
		type: "checkbox",
		checked: options.activityTimoutEnabled,
		click: (item) => {
			options.activityTimoutEnabled = item.checked;
			setOptions('discord', options);
		},
	},
	{
		label: "Set timeout time in config",
		click: () => {
			// open config.json
			edit();
		},
	},
];
