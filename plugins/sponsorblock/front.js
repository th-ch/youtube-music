const { ipcRenderer } = require("electron");

const is = require("electron-is");

const { ontimeupdate } = require("../../providers/video-element");

let currentSegments = [];

module.exports = () => {
	ipcRenderer.on("sponsorblock-skip", (_, segments) => {
		currentSegments = segments;
	});

	ontimeupdate((videoElement) => {
		if (
			currentSegments.length > 0 &&
			videoElement.currentTime >= currentSegments[0][0] &&
			videoElement.currentTime <= currentSegments[0][1]
		) {
			videoElement.currentTime = currentSegments[0][1];
			const skipped = currentSegments.shift();
			if (is.dev()) {
				console.log("SponsorBlock: skipping segment", skipped);
			}
		}
	});
};
