const { setOptions } = require("../../config/plugins");
const path = require("path");
const { app } = require("electron");
const fs = require("fs");

const icon = "assets/youtube-music.png";
const tempIcon = path.join(app.getPath("userData"), "tempIcon.png");

module.exports.urgencyLevels = [
	{ name: "Low", value: "low" },
	{ name: "Normal", value: "normal" },
	{ name: "High", value: "critical" },
];
module.exports.setUrgency = (options, level) => {
	options.urgency = level;
	setOption(options);
};
module.exports.setUnpause = (options, value) => {
	options.unpauseNotification = value;
	setOption(options);
};
module.exports.setInteractive = (options, value) => {
	options.interactive = value;
	setOption(options);
}

module.exports.notificationImage = function (songInfo, saveIcon = false) {
	//return local path to temp icon
	if (saveIcon && !!songInfo.image) {
		try {
			fs.writeFileSync(tempIcon,
				songInfo.image
					.resize({ height: 256, width: 256 })
					.toPNG()
			);
		} catch (err) {
			console.log(`Error downloading song icon:\n${err.toString()}`)
			return icon;
		}
		return tempIcon;
	}
	//else: return image
	return songInfo.image
		? songInfo.image.resize({ height: 256, width: 256 })
		: icon
};

let setOption = options => {
	setOptions("notifications", options)
};

module.exports.icons = {
	play: "\u{1405}", // ᐅ
	pause: "\u{2016}", // ‖
	next: "\u{1433}", // ᐳ
	previous: "\u{1438}" // ᐸ
}