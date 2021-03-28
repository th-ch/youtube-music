const {urgencyLevels, setUrgency} = require("./utils");

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
];
