const { Notification } = require("electron");
const is = require("electron-is");
const getSongInfo = require("../../providers/song-info");
const { notificationImage } = require("./utils");

const { setupInteractive, notifyInteractive } = require("./interactive")

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

module.exports = (win, options) => {
	const isInteractive = is.windows() && options.interactive;
	//setup interactive notifications for windows
	if (isInteractive) {
		setupInteractive(win, options.unpauseNotification);
	}
	const registerCallback = getSongInfo(win);
	let oldNotification;
	let oldURL = "";
	win.once("ready-to-show", () => {
		// Register the callback for new song information
		registerCallback(songInfo => {
			// on pause - reset url? and skip notification
			if (songInfo.isPaused) {
				//reset oldURL if unpause notification option is on
				if (options.unpauseNotification) {
					oldURL = "";
				}
				return;
			}
			// If url isn"t the same as last one - send notification
			if (songInfo.url !== oldURL) {
				oldURL = songInfo.url;
				if (isInteractive) {
					notifyInteractive(songInfo);
				} else {
					// Close the old notification
					oldNotification?.close();
					// This fixes a weird bug that would cause the notification to be updated instead of showing
					setTimeout(() => { oldNotification = notify(songInfo, options) }, 10);
				}
			}
		});
	});
};
