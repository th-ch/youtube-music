const { Notification } = require("electron");

const getSongInfo = require("../../providers/song-info");

const notify = (info) => {
	let notificationImage = "assets/youtube-music.png";

	if (info.image) {
		notificationImage = info.image.resize({ height: 256, width: 256 });
	}

	// Fill the notification with content
	const notification = {
		title: info.title || "Playing",
		body: info.artist,
		icon: notificationImage,
		silent: true,
	};
	// Send the notification
	new Notification(notification).show();
};

module.exports = (win) => {
	const registerCallback = getSongInfo(win);

	win.on("ready-to-show", () => {
		// Register the callback for new song information
		registerCallback((songInfo) => {
			// If song is playing send notification
			if (!songInfo.isPaused) {
				notify(songInfo);
			}
		});
	});
};
