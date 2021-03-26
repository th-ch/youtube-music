const { existsSync, mkdirSync } = require("fs");
const { join } = require("path");
const { URL } = require("url");

const { ipcMain } = require("electron");
const is = require("electron-is");
const ytpl = require("ytpl");

const { sendError } = require("./back");
const { defaultMenuDownloadLabel, getFolder } = require("./utils");

const { setOptions } = require('../../config/plugins')
const { dialog } = require('electron');
let downloadLabel = defaultMenuDownloadLabel;

module.exports = (win, options, refreshMenu) => [
	{
		label: downloadLabel,
		click: async () => {
			const currentURL = win.webContents.getURL();
			const playlistID = new URL(currentURL).searchParams.get("list");
			if (!playlistID) {
				sendError(win, new Error("No playlist ID found"));
				return;
			}

			const playlist = await ytpl(playlistID);
			const playlistTitle = playlist.title;

			const folder = getFolder(options.downloadFolder);
			const playlistFolder = join(folder, playlistTitle);
			if (existsSync(playlistFolder)) {
				sendError(
					win,
					new Error(`The folder ${playlistFolder} already exists`)
				);
				return;
			}
			mkdirSync(playlistFolder, { recursive: true });

			ipcMain.on("downloader-feedback", (_, feedback) => {
				downloadLabel = feedback;
				refreshMenu();
			});

			downloadLabel = `Downloading "${playlistTitle}"`;
			refreshMenu();

			if (is.dev()) {
				console.log(
					`Downloading playlist "${playlistTitle}" (${playlist.items.length} songs)`
				);
			}

			playlist.items.slice(0, options.playlistMaxItems).forEach((song) => {
				win.webContents.send(
					"downloader-download-playlist",
					song,
					playlistTitle,
					options
				);
			});
		},
	},
	{
		label: 'Choose download folder:',
		click: () => {
			let result = dialog.showOpenDialogSync({ 
				properties: ['openDirectory', 'createDirectory'],
				defaultPath: getFolder(options.downloadFolder),
			})
			if(result) {
				options.downloadFolder = result[0];
				setOptions("downloader", options);
			} //else = user pressed cancel
		}
	},
];
