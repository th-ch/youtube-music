const prompt = require("custom-electron-prompt");

const { setMenuOptions } = require("../../config/plugins");
const promptOptions = require("../../providers/prompt-options");
const { clear, connect, registerRefresh, isConnected } = require("./back");

let hasRegisterred = false;

module.exports = (win, options, refreshMenu) => {
	if (!hasRegisterred) {
		registerRefresh(refreshMenu);
		hasRegisterred = true;
	}

	return [
		{
			label: isConnected() ? "Connected" : "Reconnect",
			enabled: !isConnected(),
			click: connect,
		},
		{
			label: "Clear activity",
			click: clear,
		},
		{
			label: "Clear activity after timeout",
			type: "checkbox",
			checked: options.activityTimoutEnabled,
			click: (item) => {
				options.activityTimoutEnabled = item.checked;
				setMenuOptions('discord', options);
			},
		},
		{
			label: "Listen Along",
			type: "checkbox",
			checked: options.listenAlong,
			click: (item) => {
				options.listenAlong = item.checked;
				setMenuOptions('discord', options);
			},
		},
		{
			label: "Hide duration left",
			type: "checkbox",
			checked: options.hideDurationLeft,
			click: (item) => {
				options.hideDurationLeft = item.checked;
				setMenuOptions('discord', options);
			}
		},
		{
			label: "Set inactivity timeout",
			click: () => setInactivityTimeout(win, options),
		},
	];
};

async function setInactivityTimeout(win, options) {
	let output = await prompt({
		title: 'Set Inactivity Timeout',
		label: 'Enter inactivity timeout in seconds:',
		value: Math.round((options.activityTimoutTime ?? 0) / 1e3),
		type: "counter",
		counterOptions: { minimum: 0, multiFire: true },
		width: 450,
		...promptOptions()
	}, win)

	if (output) {
		options.activityTimoutTime = Math.round(output * 1e3);
		setMenuOptions("discord", options);
	}
}
