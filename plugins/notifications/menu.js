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
				// submenu with settings for interactive notifications (name shouldn't be too long)
				label: "Interactive Settings",
				submenu: [
					{
						label: "Open/Close on tray click",
						type: "checkbox",
						checked: options.trayControls,
						click: (item) => config.set("trayControls", item.checked),
					},
					{
						label: "Hide Button Text",
						type: "checkbox",
						checked: options.hideButtonText,
						click: (item) => config.set("hideButtonText", item.checked),
					},
					{
						label: "Refresh on Play/Pause",
						type: "checkbox",
						checked: options.refreshOnPlayPause,
						click: (item) => config.set("refreshOnPlayPause", item.checked),
					}
				]
			},
			{
				label: "Style",
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
	const arr = new Array(Object.keys(ToastStyles).length);

	// ToastStyles index starts from 1
	for (const [name, index] of Object.entries(ToastStyles)) {
		arr[index - 1] = {
			label: snakeToCamel(name),
			type: "radio",
			checked: options.toastStyle === index,
			click: () => config.set("toastStyle", index),
		};
	}

	return arr;
}
