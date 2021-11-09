const { ipcRenderer } = require("electron");

const { getImage } = require("./song-info");

global.songInfo = {};

ipcRenderer.on("update-song-info", async (_, extractedSongInfo) => {
	global.songInfo = JSON.parse(extractedSongInfo);
	global.songInfo.image = await getImage(global.songInfo.imageSrc);
});

module.exports = () => {
	document.addEventListener('apiLoaded', e => {
		setupTimeChangeListener();

		document.querySelector('video').addEventListener('loadedmetadata', () => {
			const data = e.detail.getPlayerResponse();
			ipcRenderer.send("song-info-request", JSON.stringify(data));
		});
	}, { once: true, passive: true })
};

function setupTimeChangeListener() {
	const progressObserver = new MutationObserver(mutations => {
		ipcRenderer.send('timeChanged', mutations[0].target.value);
		global.songInfo.elapsedSeconds = mutations[0].target.value;
	});
	progressObserver.observe(document.querySelector('#progress-bar'), { attributeFilter: ["value"] })
}
