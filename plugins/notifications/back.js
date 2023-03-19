const { Notification } = require("electron");
const is = require("electron-is");
const registerCallback = require("../../providers/song-info");
const { notificationImage } = require("./utils");
const config = require("./config");

const notify = (info) => {

	// Fill the notification with content
	const notification = {
		title: info.title || "Playing",
		body: info.artist,
		icon: notificationImage(info),
		silent: true,
		urgency: config.get('urgency'),
	};

	// Send the notification
	const currentNotification = new Notification(notification);
	currentNotification.show()

	return currentNotification;
};

const setup = () => {
	let oldNotification;
	let currentUrl;

	registerCallback(songInfo => {
		if (!songInfo.isPaused && (songInfo.url !== currentUrl || config.get('unpauseNotification'))) {
			// Close the old notification
			oldNotification?.close();
			currentUrl = songInfo.url;
			// This fixes a weird bug that would cause the notification to be updated instead of showing
			setTimeout(() => { oldNotification = notify(songInfo) }, 10);
		}
	});
}

/** @param {Electron.BrowserWindow} win */
module.exports = (win, options) => {
	// Register the callback for new song information
	is.windows() && options.interactive ?
		require("./interactive")(win) :
		setup();
};
