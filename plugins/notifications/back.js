const { Notification } = require("electron");
const is = require("electron-is");
const registerCallback = require("../../providers/song-info");
const { notificationImage } = require("./utils");

const notify = (info, options) => {

	// Fill the notification with content
	const notification = {
		title: info.title || "Playing",
		body: info.artist,
		icon: notificationImage(info),
		silent: true,
		urgency: options.urgency,
	};

	// Send the notification
	const currentNotification = new Notification(notification);
	currentNotification.show()

	return currentNotification;
};

const setup = (options) => {
	let oldNotification;
	let currentUrl;

	registerCallback(songInfo => {
		if (!songInfo.isPaused && (songInfo.url !== currentUrl || options.unpauseNotification)) {
			// Close the old notification
			oldNotification?.close();
			currentUrl = songInfo.url;
			// This fixes a weird bug that would cause the notification to be updated instead of showing
			setTimeout(() => { oldNotification = notify(songInfo, options) }, 10);
		}
	});
}

module.exports = (win, options) => {
	// Register the callback for new song information
	is.windows() && options.interactive ?
		require("./interactive")(win, options.unpauseNotification) :
		setup(options);
};
