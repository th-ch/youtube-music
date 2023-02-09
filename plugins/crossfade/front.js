const { ipcRenderer } = require("electron");
const { Howl } = require("howler");

// Extracted from https://github.com/bitfasching/VolumeFader
require("./fader");

let transitionAudio; // Howler audio used to fade out the current music
let firstVideo = true;
let transitioning = false;

// Crossfade options that can be overridden in plugin options
let crossfadeOptions = {
	fadeInDuration: 1500, // ms
	fadeOutDuration: 5000, // ms
	exitMusicBeforeEnd: 10, // s
	fadeScaling: "linear",
};

const getStreamURL = async (videoID) => {
	const url = await ipcRenderer.invoke("audio-url", videoID);
	return url;
};

const getVideoIDFromURL = (url) => {
	return new URLSearchParams(url.split("?")?.at(-1)).get("v");
};

const isReadyToCrossfade = () => {
	return transitionAudio && transitionAudio.state() === "loaded";
};

const watchVideoIDChanges = (cb) => {
	navigation.addEventListener("navigate", (event) => {
		const currentVideoID = getVideoIDFromURL(
			event.currentTarget.currentEntry.url
		);
		const nextVideoID = getVideoIDFromURL(event.destination.url);

		if (
			nextVideoID &&
			currentVideoID &&
			(firstVideo || nextVideoID !== currentVideoID)
		) {
			if (isReadyToCrossfade()) {
				crossfade(() => {
					cb(nextVideoID);
				});
			} else {
				cb(nextVideoID);
				firstVideo = false;
			}
		}
	});
};

const createAudioForCrossfade = async (url) => {
	if (transitionAudio) {
		transitionAudio.unload();
	}
	transitionAudio = new Howl({
		src: url,
		html5: true,
		volume: 0,
	});
	await syncVideoWithTransitionAudio();
};

const syncVideoWithTransitionAudio = async () => {
	const video = document.querySelector("video");
	const videoFader = new VolumeFader(video, {
		fadeScaling: crossfadeOptions.fadeScaling,
		fadeDuration: crossfadeOptions.fadeInDuration,
	});

	await transitionAudio.play();
	await transitionAudio.seek(video.currentTime);

	video.onseeking = () => {
		transitionAudio.seek(video.currentTime);
	};
	video.onpause = () => {
		transitionAudio.pause();
	};
	video.onplay = async () => {
		await transitionAudio.play();
		await transitionAudio.seek(video.currentTime);

		// Fade in
		const videoVolume = video.volume;
		video.volume = 0;
		videoFader.fadeTo(videoVolume);
	};

	// Exit just before the end for the transition
	const transitionBeforeEnd = () => {
		if (
			video.currentTime >=
				video.duration - crossfadeOptions.exitMusicBeforeEnd &&
			isReadyToCrossfade()
		) {
			video.removeEventListener("timeupdate", transitionBeforeEnd);

			// Go to next video - XXX: does not support "repeat 1" mode
			document.querySelector(".next-button").click();
		}
	};
	video.ontimeupdate = transitionBeforeEnd;
};

const onApiLoaded = () => {
	watchVideoIDChanges(async (videoID) => {
		if (!transitioning) {
			const url = await getStreamURL(videoID);
			await createAudioForCrossfade(url);
		}
	});
};

const crossfade = (cb) => {
	if (!isReadyToCrossfade()) {
		cb();
		return;
	}
	transitioning = true;

	const video = document.querySelector("video");

	const fader = new VolumeFader(transitionAudio._sounds[0]._node, {
		initialVolume: video.volume,
		fadeScaling: crossfadeOptions.fadeScaling,
		fadeDuration: crossfadeOptions.fadeOutDuration,
	});

	// Fade out the music
	video.volume = 0;
	fader.fadeOut(() => {
		transitioning = false;
		cb();
	});
};

module.exports = (options) => {
	crossfadeOptions = {
		...crossfadeOptions,
		options,
	};

	document.addEventListener("apiLoaded", onApiLoaded, {
		once: true,
		passive: true,
	});
};
