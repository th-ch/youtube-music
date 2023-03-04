const { join } = require("path");

const { dialog } = require("electron");

const registerCallback = require("../../providers/song-info");
const { injectCSS, listenAction } = require("../utils");
const { setBadge, sendFeedback } = require("./utils");
const { ACTIONS, CHANNEL } = require("./actions.js");

let win = {};

const sendError = (error) => {
	win.setProgressBar(-1); // close progress bar
	setBadge(0); // close badge
	sendFeedback(); // reset feedback


	console.error(error);
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

	require("./back-downloader")(win, options);

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
