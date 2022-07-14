const { ipcRenderer } = require("electron");
const is = require('electron-is');
const { getImage } = require("./song-info");

const config = require("../config");

global.songInfo = {};

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

ipcRenderer.on("update-song-info", async (_, extractedSongInfo) => {
	global.songInfo = JSON.parse(extractedSongInfo);
	global.songInfo.image = await getImage(global.songInfo.imageSrc);
});

// used because 'loadeddata' or 'loadedmetadata' weren't firing on song start for some users (https://github.com/th-ch/youtube-music/issues/473)
const srcChangedEvent = new CustomEvent('srcChanged');

module.exports = () => {
	document.addEventListener('apiLoaded', apiEvent => {
		if (config.plugins.isEnabled('tuna-obs') ||
			(is.linux() && config.plugins.isEnabled('shortcuts'))) {
			setupTimeChangeListener();
			setupRepeatChangeListener();
			setupVolumeChangeListener(apiEvent.detail);
		}
		const video = $('video');
		// name = "dataloaded" and abit later "dataupdated"
		apiEvent.detail.addEventListener('videodatachange', (name, _dataEvent) => {
			if (name !== 'dataloaded') return;
			video.dispatchEvent(srcChangedEvent);
			sendSongInfo();
		})

		for (const status of ['playing', 'pause']) {
			video.addEventListener(status, e => {
				if (Math.round(e.target.currentTime) > 0) {
					ipcRenderer.send("playPaused", {
						isPaused: status === 'pause',
						elapsedSeconds: Math.floor(e.target.currentTime)
					});
				}
			});
		}

		function sendSongInfo() {
			const data = apiEvent.detail.getPlayerResponse();

			data.videoDetails.album = $$(
				".byline.ytmusic-player-bar > .yt-simple-endpoint"
			).find(e => e.href?.includes("browse"))?.textContent;

			data.videoDetails.elapsedSeconds = Math.floor(video.currentTime);
			data.videoDetails.isPaused = false;
			ipcRenderer.send("video-src-changed", JSON.stringify(data));
		}
	}, { once: true, passive: true });
};

function setupTimeChangeListener() {
	const progressObserver = new MutationObserver(mutations => {
		ipcRenderer.send('timeChanged', mutations[0].target.value);
		global.songInfo.elapsedSeconds = mutations[0].target.value;
	});
	progressObserver.observe($('#progress-bar'), { attributeFilter: ["value"] })
}

function setupRepeatChangeListener() {
	const repeatObserver = new MutationObserver(mutations => {
		ipcRenderer.send('repeatChanged', mutations[0].target.title);
	});
	repeatObserver.observe($('#right-controls .repeat'), { attributeFilter: ["title"] });

	// Emit the initial value as well; as it's persistent between launches.
	ipcRenderer.send('repeatChanged', $('#right-controls .repeat').title);
}

function setupVolumeChangeListener(api) {
	$('video').addEventListener('volumechange', (_) => {
		ipcRenderer.send('volumeChanged', api.getVolume());
	});
	// Emit the initial value as well; as it's persistent between launches.
	ipcRenderer.send('volumeChanged', api.getVolume());
}
