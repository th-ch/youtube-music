const { urgencyLevels, setUrgency, setUnpause, setInteractive } = require("./utils");
const is = require("electron-is");

module.exports = (win, options) => [
	{
		label: "Notification Priority",
		submenu: urgencyLevels.map(level => ({
			label: level.name,
			type: "radio",
			checked: options.urgency === level.value,
			click: () => setUrgency(options, level.value)
		})),
	},
	{
		label: "Show notification on unpause",
		type: "checkbox",
		checked: options.unpauseNotification,
		click: (item) => setUnpause(options, item.checked)
	},
	...(is.windows() ?
		[{
			label: "Interactive",
			type: "checkbox",
			checked: options.interactive,
			click: (item) => setInteractive(options, item.checked)
		}] :
		[])
];
