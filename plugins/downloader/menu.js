const { existsSync, mkdirSync } = require("fs");
const { join } = require("path");

const { dialog, ipcMain } = require("electron");
const is = require("electron-is");
const ytpl = require("ytpl");
const chokidar = require('chokidar');

const { setOptions } = require("../../config/plugins");
const { sendError } = require("./back");
const { defaultMenuDownloadLabel, getFolder, presets, setBadge } = require("./utils");

let downloadLabel = defaultMenuDownloadLabel;
let playingPlaylistId = undefined;
let callbackIsRegistered = false;

module.exports = (win, options) => {
	if (!callbackIsRegistered) {
		ipcMain.on("video-src-changed", async (_, data) => {
			playingPlaylistId = JSON.parse(data)?.videoDetails?.playlistId;
		});
		callbackIsRegistered = true;
	}

	return [
		{
			label: downloadLabel,
			click: async () => {
				const currentPagePlaylistId = new URL(win.webContents.getURL()).searchParams.get("list");
				const playlistId = currentPagePlaylistId || playingPlaylistId;
				if (!playlistId) {
					sendError(win, new Error("No playlist ID found"));
					return;
				}

				console.log(`trying to get playlist ID: '${playlistId}'`);
				let playlist;
				try {
					playlist = await ytpl(playlistId, {
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

				win.setProgressBar(2); // starts with indefinite bar

				let downloadCount = 0;
				setBadge(playlist.items.length);

				let dirWatcher = chokidar.watch(playlistFolder);
				dirWatcher.on('add', () => {
					downloadCount++;
					if (downloadCount >= playlist.items.length) {
						win.setProgressBar(-1); // close progress bar
						setBadge(0); // close badge counter
						dirWatcher.close().then(() => dirWatcher = null);
					} else {
						win.setProgressBar(downloadCount / playlist.items.length);
						setBadge(playlist.items.length - downloadCount);
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
		{
			label: "Presets",
			submenu: Object.keys(presets).map((preset) => ({
				label: preset,
				type: "radio",
				click: () => {
					options.preset = preset;
					setOptions("downloader", options);
				},
				checked: options.preset === preset || presets[preset] === undefined,
			})),
		},
	];
};
