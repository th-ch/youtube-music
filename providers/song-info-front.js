const { ipcRenderer } = require("electron");

const { getImage } = require("./song-info");

global.songInfo = {};

let api = document.querySelector('#movie_player');

ipcRenderer.on("update-song-info", async (_, extractedSongInfo) => {
	global.songInfo = JSON.parse(extractedSongInfo);
	global.songInfo.image = await getImage(global.songInfo.imageSrc);
});

function setup() {
	if (api) {
		injectListener();
		return;
	}

	const observer = new MutationObserver(() => {
		api = document.querySelector('#movie_player');
		if (api) {
			observer.disconnect();
			injectListener();
		}
	})

	observer.observe(document.documentElement, { childList: true, subtree: true });
}

function injectListener() {
	document.querySelector('video').addEventListener('loadeddata', () => {
		const data = api.getPlayerResponse();
		ipcRenderer.send("song-info-request", JSON.stringify(data));
	});
};

module.exports = setup;
