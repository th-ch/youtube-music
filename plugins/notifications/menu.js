const { urgencyLevels, ToastStyles, snakeToCamel } = require("./utils");
const is = require("electron-is");
const config = require("./config");

module.exports = (_win, options) => [
	...(is.linux()
		? [
				{
					label: "Notification Priority",
					submenu: urgencyLevels.map((level) => ({
						label: level.name,
						type: "radio",
						checked: options.urgency === level.value,
						click: () => config.set("urgency", level.value),
					})),
				},
		  ]
		: []),
	...(is.windows()
		? [
				{
					label: "Interactive Notifications",
					type: "checkbox",
					checked: options.interactive,
					// doesn't update until restart
					click: (item) => config.setAndMaybeRestart("interactive", item.checked),
				},
				{
					label: "Toast Style",
					submenu: getToastStyleMenuItems(options)
				},
		  ]
		: []),
	{
		label: "Show notification on unpause",
		type: "checkbox",
		checked: options.unpauseNotification,
		click: (item) => config.set("unpauseNotification", item.checked),
	},
];

function getToastStyleMenuItems(options) {
	const arr = new Array(Object.keys(ToastStyles).length + 1);

	arr[0] = {
		label: "Hide Button Text",
		type: "checkbox",
		checked: options.hideButtonText,
		click: (item) => config.set("hideButtonText", item.checked),
	}

	// ToastStyles index starts from 1
	for (const [name, index] of Object.entries(ToastStyles)) {
		arr[index] = {
			label: snakeToCamel(name),
			type: "radio",
			checked: options.style === index,
			click: () => config.set("style", index),
		};
	}

	return arr;
}
