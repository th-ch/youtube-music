const { ipcMain, nativeImage } = require("electron");

const fetch = require("node-fetch");

// This selects the progress bar, used for current progress
const progressSelector = "#progress-bar";

// Grab the progress using the selector
const getProgress = async (win) => {
	// Get current value of the progressbar element
	const elapsedSeconds = await win.webContents.executeJavaScript(
		'document.querySelector("' + progressSelector + '").value'
	);

	return elapsedSeconds;
};

// Grab the native image using the src
const getImage = async (src) => {
	const result = await fetch(src);
	const buffer = await result.buffer();
	return nativeImage.createFromBuffer(buffer);
};

// To find the paused status, we check if the title contains `-`
const getPausedStatus = async (win) => {
	const title = await win.webContents.executeJavaScript("document.title");
	return !title.includes("-");
};

// Fill songInfo with empty values
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

const handleData = async (_event, responseText) => {
	let data = JSON.parse(responseText);
	songInfo.title = data?.videoDetails?.title;
	songInfo.artist = data?.videoDetails?.author;
	songInfo.views = data?.videoDetails?.viewCount;
	songInfo.imageSrc = data?.videoDetails?.thumbnail?.thumbnails?.pop()?.url;
	songInfo.songDuration = data?.videoDetails?.lengthSeconds;
	songInfo.image = await getImage(songInfo.imageSrc);
	songInfo.uploadDate = data?.microformat?.microformatDataRenderer?.uploadDate;
	songInfo.url = data?.microformat?.microformatDataRenderer?.urlCanonical;
};

const registerProvider = (win) => {
	// This variable will be filled with the callbacks once they register
	const callbacks = [];

	// This function will allow plugins to register callback that will be triggered when data changes
	const registerCallback = (callback) => {
		callbacks.push(callback);
	};

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
	ipcMain.on("song-info-request", handleData);

	return registerCallback;
};

module.exports = registerProvider;
