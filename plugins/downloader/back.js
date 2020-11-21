const { join } = require("path");

const { dialog } = require("electron");

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

function handle(win) {
	injectCSS(win.webContents, join(__dirname, "style.css"));

	listenAction(CHANNEL, (event, action, error) => {
		switch (action) {
			case ACTIONS.ERROR:
				sendError(win, error);
				break;
			default:
				console.log("Unknown action: " + action);
		}
	});
}

module.exports = handle;
