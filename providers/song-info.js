const { nativeImage } = require("electron");

const fetch = require("node-fetch");

// This selects the song title
const titleSelector = ".title.style-scope.ytmusic-player-bar";

// This selects the song image
const imageSelector =
	"#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > img";

// This selects the song subinfo, this includes artist, views, likes
const subInfoSelector =
	"#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > span";

// This selects the progress bar, used for songlength and current progress
const progressSelector = "#progress-bar";

// Grab the title using the selector
const getTitle = (win) => {
	return win.webContents
		.executeJavaScript(
			"document.querySelector('" + titleSelector + "').innerText"
		)
		.catch((error) => {
			console.log(error);
		});
};

// Grab the image src using the selector
const getImageSrc = (win) => {
	return win.webContents
		.executeJavaScript("document.querySelector('" + imageSelector + "').src")
		.catch((error) => {
			console.log(error);
		});
};

// Grab the subinfo using the selector
const getSubInfo = async (win) => {
	// Get innerText of subinfo element
	const subInfoString = await win.webContents.executeJavaScript(
		'document.querySelector("' + subInfoSelector + '").innerText'
	);

	// Split and clean the string
	const splittedSubInfo = subInfoString.replaceAll("\n", "").split(" • ");

	// Make sure we always return 3 elements in the aray
	const subInfo = [];
	for (let i = 0; i < 3; i++) {
		// Fill array with empty string if not defined
		subInfo.push(splittedSubInfo[i] || "");
	}

	return subInfo;
};

// Grab the progress using the selector
const getProgress = async (win) => {
	// Get max value of the progressbar element
	const songDuration = await win.webContents.executeJavaScript(
		'document.querySelector("' + progressSelector + '").max'
	);
	// Get current value of the progressbar element
	const elapsedSeconds = await win.webContents.executeJavaScript(
		'document.querySelector("' + progressSelector + '").value'
	);

	return { songDuration, elapsedSeconds };
};

// Grab the native image using the src
const getImage = async (src) => {
	const result = await fetch(src);
	const buffer = await result.buffer();
	return nativeImage.createFromBuffer(buffer);
};

const getPausedStatus = async (win) => {
	const title = await win.webContents.executeJavaScript("document.title");
	return !title.includes("-");
};

// Fill songInfo with empty values
const songInfo = {
	title: "",
	artist: "",
	views: "",
	likes: "",
	imageSrc: "",
	image: null,
	isPaused: true,
	songDuration: 0,
	elapsedSeconds: 0,
};

const registerProvider = (win) => {
	// This variable will be filled with the callbacks once they register
	const callbacks = [];

	// This function will allow plugins to register callback that will be triggered when data changes
	const registerCallback = (callback) => {
		callbacks.push(callback);
	};

	win.on("page-title-updated", async () => {
		// Save the old title temporarily
		const oldTitle = songInfo.title;
		// Get and set the new data
		songInfo.title = await getTitle(win);
		songInfo.isPaused = await getPausedStatus(win);

		const { songDuration, elapsedSeconds } = await getProgress(win);
		songInfo.songDuration = songDuration;
		songInfo.elapsedSeconds = elapsedSeconds;

		// If title changed then we do need to update other info
		if (oldTitle !== songInfo.title) {
			const subInfo = await getSubInfo(win);
			songInfo.artist = subInfo[0];
			songInfo.views = subInfo[1];
			songInfo.likes = subInfo[2];
			songInfo.imageSrc = await getImageSrc(win);
			songInfo.image = await getImage(songInfo.imageSrc);
		}

		// Trigger the callbacks
		callbacks.forEach((c) => {
			c(songInfo);
		});
	});

	return registerCallback;
};

module.exports = registerProvider;
