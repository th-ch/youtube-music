const { app } = require("electron");
const path = require("path");
const getSongControls = require("./song-controls");

const APP_PROTOCOL = "youtubemusic";

let protocolHandler;

function setupProtocolHandler(win) {
	if (process.defaultApp && process.argv.length >= 2) {
		app.setAsDefaultProtocolClient(
			APP_PROTOCOL,
			process.execPath,
			[path.resolve(process.argv[1])]
		);
	} else {
		app.setAsDefaultProtocolClient(APP_PROTOCOL)
	}

	const songControls = getSongControls(win);

	protocolHandler = (cmd) => {
		if (Object.keys(songControls).includes(cmd)) {
			songControls[cmd]();
		}
	}
}

function handleProtocol(cmd) {
	protocolHandler(cmd);
}

function changeProtocolHandler(f) {
	protocolHandler = f;
}

module.exports = {
	APP_PROTOCOL,
	setupProtocolHandler,
	handleProtocol,
	changeProtocolHandler,
};


