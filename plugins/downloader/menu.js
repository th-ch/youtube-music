const { existsSync, mkdirSync } = require("fs");
const { join } = require("path");

const { dialog, ipcMain } = require("electron");
const is = require("electron-is");
const ytpl = require("ytpl");
const chokidar = require('chokidar');

const { setOptions } = require("../../config/plugins");
const { sendError } = require("./back");
const { defaultMenuDownloadLabel, getFolder, presets } = require("./utils");

let downloadLabel = defaultMenuDownloadLabel;
let playingPlaylistId = undefined;
let callbackIsRegistered = false;

const INVALID_PLAYLIST_MODIFIER = 'RDAMPLPL';

module.exports = (win, options) => {
	if (!callbackIsRegistered) {
		ipcMain.on("video-src-changed", async (_, data) => {
			playingPlaylistId = JSON.parse(data)?.videoDetails?.playlistId;
		});
		ipcMain.on("download-playlist-request", async (_event, url) => downloadPlaylist(url, win, options));
		callbackIsRegistered = true;
	}

	return [
		{
			label: downloadLabel,
			click: () => downloadPlaylist(undefined, win, options)
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

async function downloadPlaylist(url, win, options) {
	const getPlaylistID = aURL => {
		const result = aURL?.searchParams.get("list") || aURL?.searchParams.get("playlist");
		return (!result || result.startsWith(INVALID_PLAYLIST_MODIFIER)) ? undefined : result;
	};
	if (url) {
		try {
			url = new URL(url);
		} catch {
			url = undefined;
		};
	}
	const playlistId = getPlaylistID(url)
		|| getPlaylistID(new URL(win.webContents.getURL()))
		|| playingPlaylistId;

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
			`Downloading playlist "${playlistTitle}" - ${playlist.items.length} songs (${playlistId})`
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
}
