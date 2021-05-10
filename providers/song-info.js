const { ipcMain, nativeImage } = require("electron");

const overrideSongInfo = require("../config").get("options.overrideSongInfo");

const fetch = require("node-fetch");

// Grab the native image using the src
const getImage = async (src) => {
	const result = await fetch(src);
	const buffer = await result.buffer();
	return nativeImage.createFromBuffer(buffer);
};

// This selects the progress bar, used for current progress
const progressBar = 'document.querySelector("#progress-bar")';

// Grab the progress using the selector
const getProgress = async (win) => {
	// Get current value of the progressbar element
	return await win.webContents.executeJavaScript(
		`${progressBar}?.value`
	);
};

const getsongDuration = async (win) => {
	return await win.webContents.executeJavaScript(
		`${progressBar}?.getAttribute("aria-valuetext")?.split(" of ")[1]`
	)
};

// To find the paused status, we check if the title contains `-`
const getPausedStatus = async (win) => {
	const title = await win.webContents.executeJavaScript("document.title");
	return !title.includes("-");
};

const getArtist = async (win) => {
	return await win.webContents.executeJavaScript(`
		document.querySelector(".subtitle.ytmusic-player-bar .yt-formatted-string")
			?.textContent
	`);
}

const getUploadDate = async (win) => {
	return await win.webContents.executeJavaScript(`
	document.querySelectorAll(".subtitle.ytmusic-player-bar .yt-formatted-string")[4]
		?.textContent
	`);
}

const getTitle = async (win) => {
	return await win.webContents.executeJavaScript(`
	document.querySelector(".title.ytmusic-player-bar")
		?.textContent
	`);
}

const getImageSrc = async (win) => {
	return await win.webContents.executeJavaScript(`
	document.querySelector(".image.ytmusic-player-bar")
		?.src
	`);
}

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

const handleData = async (responseText, win) => {
	let data = JSON.parse(responseText);

	songInfo.imageSrc = data?.videoDetails?.thumbnail?.thumbnails?.pop()?.url;
	songInfo.title = data?.videoDetails?.title;
	songInfo.url = data?.microformat?.microformatDataRenderer?.urlCanonical;
	songInfo.uploadDate = data?.microformat?.microformatDataRenderer?.uploadDate;
	songInfo.songDuration = data?.videoDetails?.lengthSeconds;

	if (overrideSongInfo) {
		songInfo.imageSrc = await getImageSrc(win) || songInfo.imageSrc;
		songInfo.title = await getTitle(win) || songInfo.imageSrc;
		songInfo.uploadDate = await getUploadDate(win) || songInfo.uploadDate;
		songInfo.songDuration = await getsongDuration(win) || songInfo.songDuration;
		songInfo.url = win.webContents.getURL().split("&")[0];
	}

	songInfo.artist = await getArtist(win) || cleanupArtistName(data?.videoDetails?.author);
	songInfo.views = data?.videoDetails?.viewCount;
	songInfo.image = await getImage(songInfo.imageSrc);

	win.webContents.send("update-song-info", JSON.stringify(songInfo));
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
	ipcMain.on("song-info-request", async (_, responseText) => {
		await handleData(responseText, win);
		callbacks.forEach((c) => {
			c(songInfo);
		});
	});

	return registerCallback;
};

const suffixesToRemove = [' - Topic', 'VEVO'];
function cleanupArtistName(artist) {
	if (!artist) {
		return artist;
	}
	for (const suffix of suffixesToRemove) {
		if (artist.endsWith(suffix)) {
			return artist.slice(0, -suffix.length);
		}
	}
	return artist;
}

module.exports = registerProvider;
module.exports.getImage = getImage;
module.exports.cleanupArtistName = cleanupArtistName;

