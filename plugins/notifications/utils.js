const { setMenuOptions } = require("../../config/plugins");
const path = require("path");
const { app } = require("electron");
const fs = require("fs");

const icon = "assets/youtube-music.png";
const tempIcon = path.join(app.getPath("userData"), "tempIcon.png");

module.exports.icons = {
	play: "\u{1405}", // ᐅ
	pause: "\u{2016}", // ‖
	next: "\u{1433}", // ᐳ
	previous: "\u{1438}" // ᐸ
}

module.exports.setOption = (options, option, value) => {
	options[option] = value;
	setMenuOptions("notifications", options)
}

module.exports.urgencyLevels = [
	{ name: "Low", value: "low" },
	{ name: "Normal", value: "normal" },
	{ name: "High", value: "critical" },
];

module.exports.notificationImage = function (songInfo, saveIcon = false) {
	//return local path to temp icon
	if (saveIcon && !!songInfo.image) {
		try {
			fs.writeFileSync(tempIcon,
				centerNativeImage(songInfo.image)
					.toPNG()
			);
		} catch (err) {
			console.log(`Error writing song icon to disk:\n${err.toString()}`)
			return icon;
		}
		return tempIcon;
	}
	//else: return image
	return songInfo.image
		? centerNativeImage(songInfo.image)
		: icon
};

function centerNativeImage(nativeImage) {
	const tempImage = nativeImage.resize({ height: 256 });
	const margin = Math.max((tempImage.getSize().width - 256), 0);

	return tempImage.crop({
		x: Math.round(margin / 2),
		y: 0,
		width: 256, height: 256
	})
}
