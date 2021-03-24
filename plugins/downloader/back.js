const { writeFileSync } = require("fs");
const { join } = require("path");

const ID3Writer = require("browser-id3-writer");
const { dialog, ipcMain } = require("electron");

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
		metadata = info;
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

	ipcMain.on("add-metadata", (event, filePath, songBuffer) => {
		let fileBuffer = songBuffer;

		try {
			const coverBuffer = metadata.image.toPNG();
			const writer = new ID3Writer(songBuffer);

			// Create the metadata tags
			writer
				.setFrame("TIT2", metadata.title)
				.setFrame("TPE1", [metadata.artist])
				.setFrame("APIC", {
					type: 3,
					data: coverBuffer,
					description: "",
				});
			writer.addTag();
			fileBuffer = Buffer.from(writer.arrayBuffer);
		} catch (error) {
			sendError(win, error);
		}

		writeFileSync(filePath, fileBuffer);
		// Notify the youtube-dl file
		event.reply("add-metadata-done");
	});
}

module.exports = handle;
module.exports.sendError = sendError;
