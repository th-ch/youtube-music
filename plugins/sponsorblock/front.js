const { ipcRenderer } = require("electron");

const is = require("electron-is");

const { ontimeupdate } = require("../../providers/video-element");

let currentSegments = [];

module.exports = () => {
	ipcRenderer.on("sponsorblock-skip", (_, segments) => {
		currentSegments = segments;
	});

	ontimeupdate((videoElement) => {
		currentSegments.forEach((segment) => {
			if (
				videoElement.currentTime >= segment[0] &&
				videoElement.currentTime <= segment[1]
			) {
				videoElement.currentTime = segment[1];
				if (is.dev()) {
					console.log("SponsorBlock: skipping segment", segment);
				}
			}
		});
	});
};
