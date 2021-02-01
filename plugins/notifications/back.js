const { Notification } = require("electron");

const getSongInfo = require("../../providers/song-info");

const notify = (info, notification) => {
	let notificationImage = "assets/youtube-music.png";

	if (info.image) {
		notificationImage = info.image.resize({ height: 256, width: 256 });
	}

	// Fill the notification with content
	notification.title = info.title || "Playing";
	notification.body = info.artist;
	notification.icon = notificationImage;

	// Send the notification
	notification.show();
};

module.exports = (win) => {
	const registerCallback = getSongInfo(win);
	
	// Create a notification
	let notification = new Notification( {
		title: "",
		body: "",
		icon: "assets/youtube-music.png",
		silent: true,
	});
	
	win.on("ready-to-show", () => {
		// Register the callback for new song information
		registerCallback((songInfo) => {
			// If song is playing send notification
			if (!songInfo.isPaused) {
				notify(songInfo,  notification);
			}
		});
	});
};
