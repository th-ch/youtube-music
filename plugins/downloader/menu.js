const { existsSync, mkdirSync } = require("fs");
const { join } = require("path");
const { URL } = require("url");

const { dialog, ipcMain } = require("electron");
const is = require("electron-is");
const ytpl = require("ytpl");
const chokidar = require('chokidar');

const { setOptions } = require("../../config/plugins");
const getSongInfo = require("../../providers/song-info");
const { sendError } = require("./back");
const { defaultMenuDownloadLabel, getFolder } = require("./utils");

let downloadLabel = defaultMenuDownloadLabel;
let metadataURL = undefined;
let callbackIsRegistered = false;

module.exports = (win, options) => {
	if (!callbackIsRegistered) {
		const registerCallback = getSongInfo(win);
		registerCallback((info) => {
			metadataURL = info.url;
		});
		callbackIsRegistered = true;
	}

	return [
		{
			label: downloadLabel,
			click: async () => {
				const currentURL = metadataURL || win.webContents.getURL();
				const playlistID = new URL(currentURL).searchParams.get("list");
				if (!playlistID) {
					sendError(win, new Error("No playlist ID found"));
					return;
				}

				console.log(`trying to get playlist ID: '${playlistID}'`);
				let playlist;
				try {
					playlist = await ytpl(playlistID, {
						limit: options.playlistMaxItems || Infinity,
					});
				} catch (e) {
					sendError(win, e);
					return;
				}
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

				dialog.showMessageBox({
					type: "info",
					buttons: ["OK"],
					title: "Started Download",
					message: `Downloading Playlist "${playlistTitle}"`,
					detail: `(${playlist.items.length} songs)`,
				});

				if (is.dev()) {
					console.log(
						`Downloading playlist "${playlistTitle}" (${playlist.items.length} songs)`
					);
				}

				const steps = 1 / playlist.items.length;
				let progress = 0;

				win.setProgressBar(2); // starts with indefinite bar

				let dirWatcher = chokidar.watch(playlistFolder);
				dirWatcher.on('add', () => {
					progress += steps;
					if (progress >= 0.9999) {
						win.setProgressBar(-1); // close progress bar
						dirWatcher.close().then(() => dirWatcher = null);
					} else {
						win.setProgressBar(progress);
					}
				});

				playlist.items.forEach((song) => {
					win.webContents.send(
						"downloader-download-playlist",
						song.url,
						playlistTitle,
						options
					);
				});
			},
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
					setOptions("downloader", options);
				} // else = user pressed cancel
			},
		},
	];
};
