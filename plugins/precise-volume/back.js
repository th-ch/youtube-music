const { isEnabled } = require("../../config/plugins");

/*
This is used to determine if plugin is actually active
(not if its only enabled in options)
*/
let enabled = false;

module.exports = (win) => {
	enabled = true;

	// youtube-music register some of the target listeners after DOMContentLoaded
	// did-finish-load is called after all elements finished loading, including said listeners
	// Thats the reason the timing is controlled from main
	win.webContents.once("did-finish-load", () => {
		win.webContents.send("restoreAddEventListener");
		win.webContents.send("setupVideoPlayerVolumeMousewheel", !isEnabled("hide-video-player"));
	});
};

module.exports.enabled = () => {
	return enabled;
};
