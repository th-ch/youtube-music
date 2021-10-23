const { ipcRenderer } = require("electron");

const { getImage } = require("./song-info");

global.songInfo = {};

ipcRenderer.on("update-song-info", async (_, extractedSongInfo) => {
	global.songInfo = JSON.parse(extractedSongInfo);
	global.songInfo.image = await getImage(global.songInfo.imageSrc);
});

function setup() {
    if (document.querySelector('#movie_player')) {
        injectListener();
        return;
    }

    const observer = new MutationObserver(() => {
        if (document.querySelector('#movie_player')) {
            observer.disconnect();
            injectListener();
        }
    })

    observer.observe(document.documentElement, { childList: true, subtree: true });
}

function injectListener() {
	document.querySelector('video').addEventListener('loadedmetadata', () => {
		const data = document.querySelector('#movie_player').getPlayerResponse();
		ipcRenderer.send("song-info-request", JSON.stringify(data));
	});
};

module.exports = setup;
