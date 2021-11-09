const { ipcRenderer } = require("electron");

const { getImage } = require("./song-info");

global.songInfo = {};

ipcRenderer.on("update-song-info", async (_, extractedSongInfo) => {
	global.songInfo = JSON.parse(extractedSongInfo);
	global.songInfo.image = await getImage(global.songInfo.imageSrc);
});

module.exports = () => {
	document.addEventListener('apiLoaded', e => observeSrcChange(e.detail), { once: true, passive: true });
};

// used because 'loadeddata' or 'loadedmetadata' weren't firing on song start for some users (https://github.com/th-ch/youtube-music/issues/473)
function observeSrcChange(api) {
	const srcChangedEvent = new CustomEvent('srcChanged');

	const video = document.querySelector('video');

	const playbackModeObserver = new MutationObserver((mutations) => {
		mutations.forEach(mutation => {
			if (mutation.target.src) { // in first mutation src is usually an empty string (loading)
				video.dispatchEvent(srcChangedEvent);
				ipcRenderer.send("song-info-request", JSON.stringify(api.getPlayerResponse()));
			}
		})
	});
	playbackModeObserver.observe(video, { attributeFilter: ["src"] })
}
