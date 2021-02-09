const fs = require('fs');
const { join } = require("path");

const { dialog, ipcMain } = require("electron");

const { injectCSS, listenAction } = require("../utils");
const { ACTIONS, CHANNEL } = require("./actions.js");

const getSongInfo = require("../../providers/song-info");
const ID3Writer = require('browser-id3-writer');

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
	let songInfo = {}
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
	
	// Save the songInfo when it updates
	getSongInfo(win)(song=>{
		songInfo = song;
	})

	ipcMain.on('add-metadata', (event, filePath) => {
		try {
			const songBuffer = fs.readFileSync(filePath);
			const coverBuffer = songInfo.image.toPNG();
			const writer = new ID3Writer(songBuffer);
			
			// Create the metadata tags
			writer.setFrame('TIT2', songInfo.title)
				.setFrame('TPE1', [songInfo.artist])
				.setFrame('APIC', {
					type: 3,
					data: coverBuffer,
					description: ''
				});
			writer.addTag();

			// Overwrite the old file, with the new file with metadata
			fs.writeFileSync(filePath, Buffer.from(writer.arrayBuffer), {flag:'w'});
		} catch (error) {
			sendError(win, error);
		}
		// Notify the youtube-dl file
		event.reply('add-metadata-done');
	})

}

module.exports = handle;
