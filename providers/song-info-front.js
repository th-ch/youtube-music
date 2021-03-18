const { ipcRenderer } = require("electron");

const injectListener = () => {
	var oldXHR = window.XMLHttpRequest;
	function newXHR() {
		var realXHR = new oldXHR();
		realXHR.addEventListener("readystatechange", function() {
			if(realXHR.readyState==4 && realXHR.status==200){
				if (realXHR.responseURL.includes('/player'))
					// if the request is the contains the song info send the response to ipcMain
					ipcRenderer.send(
						"song-info-request",
						realXHR.responseText
					);
			}
		}, false);
		return realXHR;
	}
	window.XMLHttpRequest = newXHR;
}
module.exports = injectListener