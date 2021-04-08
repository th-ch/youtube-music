const { Notification } = require("electron");
const is = require("electron-is");
const getSongInfo = require("../../providers/song-info");
const { notificationImage } = require("./utils");

const { setup, notifyInteractive } = require("./interactive")

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
	//setup interactive notifications for windows
	if (is.windows()) {
		setup(win);
	}
	const registerCallback = getSongInfo(win);
	let oldNotification;
	let oldURL = "";
	win.on("ready-to-show", () => {
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
				if (is.windows() && options.interactive) {
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
