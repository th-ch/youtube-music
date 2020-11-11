const { nativeImage, Notification } = require("electron");

const { listenAction } = require("../utils");
const { ACTIONS, CHANNEL } = require("./actions.js");

function notify(info) {
	let notificationImage = "assets/youtube-music.png";
	if (info.image) {
		notificationImage = nativeImage.createFromDataURL(info.image);
	}

	const notification = {
		title: info.title || "Playing",
		body: info.artist,
		icon: notificationImage,
		silent: true,
	};
	new Notification(notification).show();
}

function listenAndNotify() {
	listenAction(CHANNEL, (event, action, imageSrc) => {
		switch (action) {
			case ACTIONS.NOTIFICATION:
				notify(imageSrc);
				break;
			default:
				console.log("Unknown action: " + action);
		}
	});
}

module.exports = listenAndNotify;
