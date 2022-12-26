const hark = require("hark/hark.bundle.js");

module.exports = (options) => {
	let isSilent = false;
	let hasAudioStarted = false;

	document.addEventListener("apiLoaded", () => {
		const video = document.querySelector("video");
		const speechEvents = hark(video, {
			threshold: -100, // dB (-100 = absolute silence, 0 = loudest)
			interval: 2, // ms
		});
		const skipSilence = () => {
			if (options.onlySkipBeginning && hasAudioStarted) {
				return;
			}

			if (isSilent && !video.paused) {
				video.currentTime += 0.2; // in s
			}
		};

		speechEvents.on("speaking", function () {
			isSilent = false;
			hasAudioStarted = true;
		});

		speechEvents.on("stopped_speaking", function () {
			if (
				!(
					video.paused ||
					video.seeking ||
					video.ended ||
					video.muted ||
					video.volume === 0
				)
			) {
				isSilent = true;
				skipSilence();
			}
		});

		video.addEventListener("play", function () {
			hasAudioStarted = false;
			skipSilence();
		});

		video.addEventListener("seeked", function () {
			hasAudioStarted = false;
			skipSilence();
		});
	});
};
