const { existsSync, mkdirSync } = require("fs");
const { join } = require("path");

const { dialog, ipcMain } = require("electron");
const is = require("electron-is");
const ytpl = require("ytpl");
const chokidar = require('chokidar');
const filenamify = require('filenamify');

const { setMenuOptions } = require("../../config/plugins");
const { sendError } = require("./back");
const { defaultMenuDownloadLabel, getFolder, presets, setBadge } = require("./utils");

let downloadLabel = defaultMenuDownloadLabel;
let playingUrl = undefined;
let callbackIsRegistered = false;

// Playlist radio modifier needs to be cut from playlist ID
const INVALID_PLAYLIST_MODIFIER = 'RDAMPL';

const getPlaylistID = aURL => {
	const result = aURL?.searchParams.get("list") || aURL?.searchParams.get("playlist");
	if (result?.startsWith(INVALID_PLAYLIST_MODIFIER)) {
		return result.slice(6)
	}
	return result;
};

module.exports = (win, options) => {
	if (!callbackIsRegistered) {
		ipcMain.on("video-src-changed", async (_, data) => {
			playingUrl = JSON.parse(data)?.microformat?.microformatDataRenderer?.urlCanonical;
		});
		ipcMain.on("download-playlist-request", async (_event, url) => downloadPlaylist(url, win, options));
		callbackIsRegistered = true;
	}

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
				checked: options.preset === preset || presets[preset] === undefined,
			})),
		},
	];
};

async function downloadPlaylist(givenUrl, win, options) {
	if (givenUrl) {
		try {
			givenUrl = new URL(givenUrl);
		} catch {
			givenUrl = undefined;
		};
	}
	const playlistId = getPlaylistID(givenUrl)
		|| getPlaylistID(new URL(win.webContents.getURL()))
		|| getPlaylistID(new URL(playingUrl));

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
	const safePlaylistTitle = filenamify(playlist.title, {replacement: ' '});

	const folder = getFolder(options.downloadFolder);
	const playlistFolder = join(folder, safePlaylistTitle);
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
		message: `Downloading Playlist "${playlist.title}"`,
		detail: `(${playlist.items.length} songs)`,
	});

	if (is.dev()) {
		console.log(
			`Downloading playlist "${playlist.title}" - ${playlist.items.length} songs (${playlistId})`
		);
	}

	win.setProgressBar(2); // starts with indefinite bar

	let downloadCount = 0;
	setBadge(playlist.items.length);

	let dirWatcher = chokidar.watch(playlistFolder);
	dirWatcher.on('add', () => {
		downloadCount += 1;
		if (downloadCount >= playlist.items.length) {
			win.setProgressBar(-1); // close progress bar
			setBadge(0); // close badge counter
			dirWatcher.close().then(() => (dirWatcher = null));
		} else {
			win.setProgressBar(downloadCount / playlist.items.length);
			setBadge(playlist.items.length - downloadCount);
		}
	});

	playlist.items.forEach((song) => {
		win.webContents.send(
			"downloader-download-playlist",
			song.url,
			safePlaylistTitle,
			options
		);
	});
}
