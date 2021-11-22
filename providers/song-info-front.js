const { ipcRenderer } = require("electron");

const { getImage } = require("./song-info");

const config = require("../config");

global.songInfo = {};

function $(selector) { return document.querySelector(selector); }

ipcRenderer.on("update-song-info", async (_, extractedSongInfo) => {
	global.songInfo = JSON.parse(extractedSongInfo);
	global.songInfo.image = await getImage(global.songInfo.imageSrc);
});

module.exports = () => {
	document.addEventListener('apiLoaded', e => {
		if (config.plugins.isEnabled('tuna-obs')) {
			setupTimeChangeListener();
		}

		$('video').addEventListener('loadedmetadata', () => {
			const data = e.detail.getPlayerResponse();
			data.videoDetails.album = $('ytmusic-player-page')?.__data?.playerPageWatchMetadata?.albumName?.runs[0].text
			ipcRenderer.send("song-info-request", JSON.stringify(data));
		});
	}, { once: true, passive: true })
};

function setupTimeChangeListener() {
	const progressObserver = new MutationObserver(mutations => {
		ipcRenderer.send('timeChanged', mutations[0].target.value);
		global.songInfo.elapsedSeconds = mutations[0].target.value;
	});
	progressObserver.observe($('#progress-bar'), { attributeFilter: ["value"] })
}
