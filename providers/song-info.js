const { ipcMain, nativeImage } = require("electron");

const fetch = require("node-fetch");

const config = require("../config");

const { cache } = require("../providers/decorators")

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
	album: undefined,
	videoId: "",
	playlistId: "",
};

// Grab the native image using the src
const getImage = cache(
	/** 
	 * @returns {Promise<Electron.NativeImage>}
	 */
	async (src) => {
		const result = await fetch(src);
		const buffer = await result.buffer();
		const output = nativeImage.createFromBuffer(buffer);
		if (output.isEmpty() && !src.endsWith(".jpg") && src.includes(".jpg")) { // fix hidden webp files (https://github.com/th-ch/youtube-music/issues/315)
			return getImage(src.slice(0, src.lastIndexOf(".jpg") + 4));
		} else {
			return output;
		}
	}
);

const handleData = async (responseText, win) => {
	const data = JSON.parse(responseText);
	if (!data) return;

	const microformat = data.microformat?.microformatDataRenderer;
	if (microformat) {
		songInfo.uploadDate = microformat.uploadDate;
		songInfo.url = microformat.urlCanonical?.split("&")[0];
		songInfo.playlistId = new URL(microformat.urlCanonical).searchParams.get("list");
		// used for options.resumeOnStart
		config.set("url", microformat.urlCanonical);
	}

	const videoDetails = data.videoDetails;
	if (videoDetails) {
		songInfo.title = cleanupName(videoDetails.title);
		songInfo.artist = cleanupName(videoDetails.author);
		songInfo.views = videoDetails.viewCount;
		songInfo.songDuration = videoDetails.lengthSeconds;
		songInfo.elapsedSeconds = videoDetails.elapsedSeconds;
		songInfo.isPaused = videoDetails.isPaused;
		songInfo.videoId = videoDetails.videoId;
		songInfo.album = data?.videoDetails?.album; // Will be undefined if video exist

		const thumbnails = videoDetails.thumbnail?.thumbnails;
		songInfo.imageSrc = thumbnails[thumbnails.length - 1]?.url.split("?")[0];
		songInfo.image = await getImage(songInfo.imageSrc);
		
		win.webContents.send("update-song-info", JSON.stringify(songInfo));
	}
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

let handlingData = false;

const registerProvider = (win) => {
	// This will be called when the song-info-front finds a new request with song data
	ipcMain.on("video-src-changed", async (_, responseText) => {
		handlingData = true;
		await handleData(responseText, win);
		handlingData = false;
		callbacks.forEach((c) => {
			c(songInfo, "video-src-changed");
		});
	});
	ipcMain.on("playPaused", (_, { isPaused, elapsedSeconds }) => {
		songInfo.isPaused = isPaused;
		songInfo.elapsedSeconds = elapsedSeconds;
		if (handlingData) return;
		callbacks.forEach((c) => {
			c(songInfo, "playPaused");
		});
	})
};

const suffixesToRemove = [
	" - topic",
	"vevo",
	" (performance video)",
	" (clip officiel)",
];

function cleanupName(name) {
	if (!name) return name;
	name = name.replace(/\((?:official)?[ ]?(?:music)?[ ]?(?:lyric[s]?)?[ ]?(?:video)?\)$/i, '')
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
