const { ipcRenderer } = require("electron");

const { getImage } = require("./song-info");

global.songInfo = {};

ipcRenderer.on("update-song-info", async (_, extractedSongInfo) => {
	global.songInfo = JSON.parse(extractedSongInfo);
	global.songInfo.image = await getImage(global.songInfo.imageSrc);
});

// used because 'loadeddata' or 'loadedmetadata' weren't firing on song start for some users (https://github.com/th-ch/youtube-music/issues/473)
const srcChangedEvent = new CustomEvent('srcChanged');

module.exports = () => {
	document.addEventListener('apiLoaded', apiEvent => {
		const video = document.querySelector('video');
		// name = "dataloaded" and abit later "dataupdated"
		apiEvent.detail.addEventListener('videodatachange', (name, _dataEvent) => {
			if (name !== 'dataloaded') return;
			video.dispatchEvent(srcChangedEvent);
			ipcRenderer.send("video-src-changed", JSON.stringify(apiEvent.detail.getPlayerResponse()));
		})
		for (const status of ['playing', 'pause']) {
			video.addEventListener(status, sendSongInfo);
		}
		function sendSongInfo() {
			const data = apiEvent.detail.getPlayerResponse();
			data.videoDetails.elapsedSeconds = Math.floor(video.currentTime);
			data.videoDetails.isPaused = video.paused;
			ipcRenderer.send("song-info-request", JSON.stringify(apiEvent.detail.getPlayerResponse()));
		}
	}, { once: true, passive: true });
};
