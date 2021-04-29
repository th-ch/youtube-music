const { ipcRenderer } = require("electron");

const { getImage } = require("./song-info");

global.songInfo = {};

ipcRenderer.on("update-song-info", async (_, extractedSongInfo) => {
	global.songInfo = JSON.parse(extractedSongInfo);
	global.songInfo.image = await getImage(global.songInfo.imageSrc);
});

const injectListener = () => {
	var oldXHR = window.XMLHttpRequest;
	function newXHR() {
		var realXHR = new oldXHR();
		realXHR.addEventListener(
			"readystatechange",
			() => {
				if (realXHR.readyState == 4 && realXHR.status == 200) {
					if (realXHR.responseURL.includes("/player")) {
						// if the request contains the song info, send the response to ipcMain
						ipcRenderer.send("song-info-request", realXHR.responseText);
					}
				}
			},
			false
		);
		return realXHR;
	}
	window.XMLHttpRequest = newXHR;
};
module.exports = injectListener;
