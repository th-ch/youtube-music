const { ipcRenderer } = require("electron");
const { getImage } = require("./song-info");
const { singleton } = require("../providers/decorators");

global.songInfo = {};

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

ipcRenderer.on("update-song-info", async (_, extractedSongInfo) => {
	global.songInfo = JSON.parse(extractedSongInfo);
	global.songInfo.image = await getImage(global.songInfo.imageSrc);
});

// used because 'loadeddata' or 'loadedmetadata' weren't firing on song start for some users (https://github.com/th-ch/youtube-music/issues/473)
const srcChangedEvent = new CustomEvent('srcChanged');

module.exports.setupSeekedListener = singleton(() => {
	$('video')?.addEventListener('seeked', v => ipcRenderer.send('seeked', v.target.currentTime));
});

module.exports.setupTimeChangedListener = singleton(() => {
	const progressObserver = new MutationObserver(mutations => {
		ipcRenderer.send('timeChanged', mutations[0].target.value);
		global.songInfo.elapsedSeconds = mutations[0].target.value;
	});
	progressObserver.observe($('#progress-bar'), { attributeFilter: ["value"] });
});

module.exports.setupRepeatChangedListener = singleton(() => {
	const repeatObserver = new MutationObserver(mutations => {
		ipcRenderer.send('repeatChanged', mutations[0].target.__dataHost.getState().queue.repeatMode);
	});
	repeatObserver.observe($('#right-controls .repeat'), { attributeFilter: ["title"] });

	// Emit the initial value as well; as it's persistent between launches.
	ipcRenderer.send('repeatChanged', $('ytmusic-player-bar').getState().queue.repeatMode);
});

module.exports.setupVolumeChangedListener = singleton((api) => {
	$('video').addEventListener('volumechange', (_) => {
		ipcRenderer.send('volumeChanged', api.getVolume());
	});
	// Emit the initial value as well; as it's persistent between launches.
	ipcRenderer.send('volumeChanged', api.getVolume());
});

module.exports = () => {
	document.addEventListener('apiLoaded', apiEvent => {
		ipcRenderer.on("setupTimeChangedListener", async () => {
			this.setupTimeChangedListener();
		});

		ipcRenderer.on("setupRepeatChangedListener", async () => {
			this.setupRepeatChangedListener();
		});

		ipcRenderer.on("setupVolumeChangedListener", async () => {
			this.setupVolumeChangedListener(apiEvent.detail);
		});

		ipcRenderer.on("setupSeekedListener", async () => {
			this.setupSeekedListener();
		});

		const video = $('video');
		// name = "dataloaded" and abit later "dataupdated"
		apiEvent.detail.addEventListener('videodatachange', (name, _dataEvent) => {
			if (name !== 'dataloaded') return;
			video.dispatchEvent(srcChangedEvent);
			setTimeout(sendSongInfo, 200);
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
			).find(e =>
				e.href?.includes("browse/FEmusic_library_privately_owned_release")
				|| e.href?.includes("browse/MPREb")
			)?.textContent;

			data.videoDetails.elapsedSeconds = 0;
			data.videoDetails.isPaused = false;
			ipcRenderer.send("video-src-changed", JSON.stringify(data));
		}
	}, { once: true, passive: true });
};
