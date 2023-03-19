const { app } = require("electron");
const is = require('electron-is');

module.exports.getFolder = customFolder => customFolder || app.getPath("downloads");
module.exports.defaultMenuDownloadLabel = "Download playlist";

module.exports.sendFeedback = (win, message) => {
	win.webContents.send("downloader-feedback", message);
};

module.exports.cropMaxWidth = (image) => {
	const imageSize = image.getSize();
	// standart youtube artwork width with margins from both sides is 280 + 720 + 280
	if (imageSize.width === 1280 && imageSize.height === 720) {
		return image.crop({
			x: 280,
			y: 0,
			width: 720,
			height: 720
		});
	}
	return image;
}

// Presets for FFmpeg
module.exports.presets = {
	"None (defaults to mp3)": undefined,
	opus: {
		extension: "opus",
		ffmpegArgs: ["-acodec", "libopus"],
	},
};

module.exports.setBadge = n => {
	if (is.linux() || is.macOS()) {
		app.setBadgeCount(n);
	}
}
