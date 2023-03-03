const { writeFileSync } = require("fs");
const { join } = require("path");

const ID3Writer = require("browser-id3-writer");
const { dialog, ipcMain } = require("electron");

const registerCallback = require("../../providers/song-info");
const { injectCSS, listenAction } = require("../utils");
const { cropMaxWidth } = require("./utils");
const { ACTIONS, CHANNEL } = require("./actions.js");
const { isEnabled } = require("../../config/plugins");
const { getImage } = require("../../providers/song-info");
const { fetchFromGenius } = require("../lyrics-genius/back");

let win = {};

const sendError = (error) => {
	win.setProgressBar(-1); // close progress bar
	dialog.showMessageBox({
		type: "info",
		buttons: ["OK"],
		title: "Error in download!",
		message: "Argh! Apologies, download failed…",
		detail: error.toString(),
	});
};

let nowPlayingMetadata = {};


function handle(win_, options) {
	win = win_;
	injectCSS(win.webContents, join(__dirname, "style.css"));

	require("./back-downloader")(options);

	registerCallback((info) => {
		nowPlayingMetadata = info;
	});

	listenAction(CHANNEL, (event, action, arg) => {
		switch (action) {
			case ACTIONS.ERROR: // arg = error
				sendError(arg);
				break;
			case ACTIONS.METADATA:
				event.returnValue = JSON.stringify(nowPlayingMetadata);
				break;
			case ACTIONS.PROGRESS: // arg = progress
				win.setProgressBar(arg);
				break;
			default:
				console.log("Unknown action: " + action);
		}
	});
}

module.exports = handle;
module.exports.sendError = sendError;
