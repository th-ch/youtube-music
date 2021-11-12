const { ipcMain, nativeImage } = require("electron");

const fetch = require("node-fetch");

const config = require("../config");

// Grab the progress using the selector
const getProgress = async (win) => {
	// Get current value of the progressbar element
	return win.webContents.executeJavaScript(
		'document.querySelector("#progress-bar").value'
	);
};

// Grab the native image using the src
const getImage = async (src) => {
	const result = await fetch(src);
	const buffer = await result.buffer();
	const output = nativeImage.createFromBuffer(buffer);
	if (output.isEmpty() && !src.endsWith(".jpg") && src.includes(".jpg")) { // fix hidden webp files (https://github.com/th-ch/youtube-music/issues/315)
		return getImage(src.slice(0, src.lastIndexOf(".jpg")+4));
	} else {
		return output;
	}
};

// To find the paused status, we check if the title contains `-`
const getPausedStatus = async (win) => {
	const title = await win.webContents.executeJavaScript("document.title");
	return !title.includes("-");
};

// Fill songInfo with empty values
/**
 * @typedef {songInfo} SongInfo
 */
const songInfo = {
	title: "",
	artist: "",
	views: 0,
	uploadDate: "",
	imageSrc: "",
	image: null,
	isPaused: undefined,
	songDuration: 0,
	elapsedSeconds: 0,
	url: "",
};

const handleData = async (responseText, win) => {
	let data = JSON.parse(responseText);
	songInfo.title = cleanupName(data?.videoDetails?.title);
	songInfo.artist =cleanupName(data?.videoDetails?.author);
	songInfo.views = data?.videoDetails?.viewCount;
	songInfo.imageSrc = data?.videoDetails?.thumbnail?.thumbnails?.pop()?.url.split("?")[0];
	songInfo.songDuration = data?.videoDetails?.lengthSeconds;
	songInfo.image = await getImage(songInfo.imageSrc);
	songInfo.uploadDate = data?.microformat?.microformatDataRenderer?.uploadDate;
	songInfo.url = data?.microformat?.microformatDataRenderer?.urlCanonical?.split("&")[0];

	// used for options.resumeOnStart
	config.set("url", data?.microformat?.microformatDataRenderer?.urlCanonical);

	win.webContents.send("update-song-info", JSON.stringify(songInfo));
};

// This variable will be filled with the callbacks once they register
const callbacks = [];

// This function will allow plugins to register callback that will be triggered when data changes
/**
 * @callback songInfoCallback
 * @param {songInfo} songInfo
 * @returns {void}
 */
/**
 * @param {songInfoCallback} callback
 */
const registerCallback = (callback) => {
	callbacks.push(callback);
};

const registerProvider = (win) => {
	win.on("page-title-updated", async () => {
		// Get and set the new data
		songInfo.isPaused = await getPausedStatus(win);

		const elapsedSeconds = await getProgress(win);
		songInfo.elapsedSeconds = elapsedSeconds;

		// Trigger the callbacks
		callbacks.forEach((c) => {
			c(songInfo);
		});
	});

	// This will be called when the song-info-front finds a new request with song data
	ipcMain.on("song-info-request", async (_, responseText) => {
		await handleData(responseText, win);
		callbacks.forEach((c) => {
			c(songInfo);
		});
	});
};

const suffixesToRemove = [
	" - topic",
	"vevo",
	" (performance video)",
	" (official music video)",
	" (official video)",
	" (clip officiel)",
];

function cleanupName(name) {
	if (!name) return name;
    const lowCaseName = name.toLowerCase();
	for (const suffix of suffixesToRemove) {
		if (lowCaseName.endsWith(suffix)) {
			return name.slice(0, -suffix.length);
		}
	}
	return name;
}

module.exports = registerCallback;
module.exports.setupSongInfo = registerProvider;
module.exports.getImage = getImage;
module.exports.cleanupName = cleanupName;
