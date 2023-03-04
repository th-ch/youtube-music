const { dialog } = require("electron");

const { downloadPlaylist } = require("./back");
const { defaultMenuDownloadLabel, getFolder, presets } = require("./utils");
const config = require("./config");

let downloadLabel = defaultMenuDownloadLabel;

module.exports = () => {
	return [
		{
			label: downloadLabel,
			click: () => downloadPlaylist(),
		},
		{
			label: "Choose download folder",
			click: () => {
				let result = dialog.showOpenDialogSync({
					properties: ["openDirectory", "createDirectory"],
					defaultPath: getFolder(config.get('downloadFolder')),
				});
				if (result) {
					config.set("downloadFolder", result[0]);
				} // else = user pressed cancel
			},
		},
		{
			label: "Presets",
			submenu: Object.keys(presets).map((preset) => ({
				label: preset,
				type: "radio",
				checked: config.get('preset') === preset,
				click: () => {
					config.set("preset", preset);
				},
			})),
		},
		{
			label: "Skip existing files",
			type: "checkbox",
			checked: config.get('skipExisting'),
			click: (item) => {
				config.set("skipExisting", item.checked);
			}
		}
	];
};
