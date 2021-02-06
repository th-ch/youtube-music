const { Notification } = require("electron");
const getSongInfo = require("../../providers/song-info");

const notify = info => {
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
	currentNotification = new Notification(notification);
	currentNotification.show()
	
	return currentNotification;
};

module.exports = (win) => {
	const registerCallback = getSongInfo(win);
	let oldNotification;
	win.on("ready-to-show", () => {
		// Register the callback for new song information
		registerCallback(songInfo => {
			// If song is playing send notification
			if (!songInfo.isPaused) {	
				// Close the old notification
				oldNotification?.close();
				// This fixes a weird bug that would cause the notification to be updated instead of showing
				setTimeout(()=>{ oldNotification = notify(songInfo) }, 10);
			}
		});
	});
};
