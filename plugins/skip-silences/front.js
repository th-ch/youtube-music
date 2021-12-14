const hark = require("hark/hark.bundle.js");

module.exports = () => {
	let isSilent = false;

	document.addEventListener("apiLoaded", (apiEvent) => {
		const video = document.querySelector("video");
		const speechEvents = hark(video, {
			threshold: -90, // dB (-100 = absolute silence, 0 = loudest)
			interval: 2, // ms
		});
		const skipSilence = () => {
			if (isSilent && !video.paused) {
				video.currentTime += 0.2; // in s
			}
		};

		speechEvents.on("speaking", function () {
			isSilent = false;
		});

		speechEvents.on("stopped_speaking", function () {
			isSilent = true;
			skipSilence();
		});

		video.addEventListener("play", function () {
			skipSilence();
		});

		video.addEventListener("seeked", function () {
			skipSilence();
		});
	});
};
