const { ontimeupdate } = require("../../providers/video-element");

module.exports = () => {
	ontimeupdate((videoElement) => {
		if (videoElement.currentTime === 0 && videoElement.duration !== NaN) {
			// auto-confirm-when-paused plugin can interfere here if not disabled!
			videoElement.pause();
		}
	});
};
