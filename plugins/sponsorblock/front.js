const { ipcRenderer } = require("electron");

const is = require("electron-is");

let currentSegments = [];

module.exports = () => {
	ipcRenderer.on("sponsorblock-skip", (_, segments) => {
		currentSegments = segments;
	});

	document.addEventListener('apiLoaded', () => {
		const video = document.querySelector('video');

		video.addEventListener('timeupdate', e => {
			currentSegments.forEach((segment) => {
				if (
					e.target.currentTime >= segment[0] &&
					e.target.currentTime < segment[1]
				) {
					e.target.currentTime = segment[1];
					if (is.dev()) {
						console.log("SponsorBlock: skipping segment", segment);
					}
				}
			});
		})
		// Reset segments on song end
		video.addEventListener('emptied', () => currentSegments = []);
	}, { once: true, passive: true })
};
