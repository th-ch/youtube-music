const { setMenuOptions } = require("../../config/plugins");
const path = require("path");
const { app } = require("electron");
const fs = require("fs");

const icon = "assets/youtube-music.png";
const userData = app.getPath("userData");
const tempIcon = path.join(userData, "tempIcon.png");

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

module.exports.notificationImage = (songInfo, saveIcon = false) => {
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

module.exports.save_temp_icons = () => {
    for (const kind of Object.keys(module.exports.icons)) {
		const destinationPath = path.join(userData, 'icons', `${kind}.png`);
		if (fs.existsSync(destinationPath)) continue;
        const iconPath = path.resolve(__dirname, "../../assets/media-icons-black", `${kind}.png`);
		fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
		fs.copyFile(iconPath, destinationPath, ()=>{});
    }
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
