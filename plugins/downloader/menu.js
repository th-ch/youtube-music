const { dialog } = require("electron");

const { setMenuOptions } = require("../../config/plugins");
const { downloadPlaylist } = require("./back");
const { defaultMenuDownloadLabel, getFolder, presets } = require("./utils");

let downloadLabel = defaultMenuDownloadLabel;

module.exports = (win, options) => {
	return [
		{
			label: downloadLabel,
			click: () => downloadPlaylist(undefined, win, options),
		},
		{
			label: "Choose download folder",
			click: () => {
				let result = dialog.showOpenDialogSync({
					properties: ["openDirectory", "createDirectory"],
					defaultPath: getFolder(options.downloadFolder),
				});
				if (result) {
					options.downloadFolder = result[0];
					setMenuOptions("downloader", options);
				} // else = user pressed cancel
			},
		},
		{
			label: "Presets",
			submenu: Object.keys(presets).map((preset) => ({
				label: preset,
				type: "radio",
				click: () => {
					options.preset = preset;
					setMenuOptions("downloader", options);
				},
				checked: options.preset === preset,
			})),
		},
		{
			label: "Skip existing files",
			type: "checkbox",
			checked: options.skipExisting,
			click: () => {
				options.skipExisting = !options.skipExisting;
				setMenuOptions("downloader", options);
			}
		}
	];
};
