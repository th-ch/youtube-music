const { join } = require("path");

const { dialog } = require("electron");

const getSongInfo = require("../../providers/song-info");
const { injectCSS, listenAction } = require("../utils");
const { ACTIONS, CHANNEL } = require("./actions.js");

const sendError = (win, err) => {
	const dialogOpts = {
		type: "info",
		buttons: ["OK"],
		title: "Error in download!",
		message: "Argh! Apologies, download failed…",
		detail: err.toString(),
	};
	dialog.showMessageBox(dialogOpts);
};

let metadata = {};

function handle(win) {
	injectCSS(win.webContents, join(__dirname, "style.css"));
	const registerCallback = getSongInfo(win);
	registerCallback((info) => {
		metadata = {
			...info,
			image: info.image ? info.image.toDataURL() : undefined,
		};
	});

	listenAction(CHANNEL, (event, action, error) => {
		switch (action) {
			case ACTIONS.ERROR:
				sendError(win, error);
				break;
			case ACTIONS.METADATA:
				event.returnValue = JSON.stringify(metadata);
				break;
			default:
				console.log("Unknown action: " + action);
		}
	});
}

module.exports = handle;
