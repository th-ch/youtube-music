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
			sendSongInfo();
		})

		for (const status of ['playing', 'pause']) {
			video.addEventListener(status, e => {
				if (Math.floor(e.target.currentTime) > 0) {
					ipcRenderer.send("playPaused", {
						isPaused: status === 'pause',
						elapsedSeconds: Math.floor(e.target.currentTime)
					});
				}
			});
		}

		function sendSongInfo() {
			const data = apiEvent.detail.getPlayerResponse();
			data.videoDetails.elapsedSeconds = Math.floor(video.currentTime);
			data.videoDetails.isPaused = false;
			ipcRenderer.send("video-src-changed", JSON.stringify(data));
		}
	}, { once: true, passive: true });
};
