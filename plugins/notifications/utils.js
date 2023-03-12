const path = require("path");
const { app } = require("electron");
const fs = require("fs");
const config = require("./config");

const icon = "assets/youtube-music.png";
const userData = app.getPath("userData");
const tempIcon = path.join(userData, "tempIcon.png");
const tempBanner = path.join(userData, "tempBanner.png");

const { cache } = require("../../providers/decorators")

module.exports.ToastStyles = {
	logo: 1,
	banner_centered_top: 2,
	hero: 3,
	banner_top_custom: 4,
	banner_centered_bottom: 5,
	banner_bottom: 6,
	legacy: 7
}

module.exports.icons = {
	play: "\u{1405}", // ᐅ
	pause: "\u{2016}", // ‖
	next: "\u{1433}", // ᐳ
	previous: "\u{1438}" // ᐸ
}

module.exports.urgencyLevels = [
	{ name: "Low", value: "low" },
	{ name: "Normal", value: "normal" },
	{ name: "High", value: "critical" },
];

const nativeImageToLogo = cache((nativeImage) => {
	const tempImage = nativeImage.resize({ height: 256 });
	const margin = Math.max(tempImage.getSize().width - 256, 0);

	return tempImage.crop({
		x: Math.round(margin / 2),
		y: 0,
		width: 256,
		height: 256,
	});
});

module.exports.notificationImage = (songInfo) => {
	if (!songInfo.image) return icon;
	if (!config.get("interactive")) return nativeImageToLogo(songInfo.image);

	switch (config.get("toastStyle")) {
		case module.exports.ToastStyles.logo:
		case module.exports.ToastStyles.legacy:
			return this.saveImage(nativeImageToLogo(songInfo.image), tempIcon);
		default:
			return this.saveImage(songInfo.image, tempBanner);
	};
};

module.exports.saveImage = cache((img, save_path) => {
	try {
		fs.writeFileSync(save_path, img.toPNG());
	} catch (err) {
		console.log(`Error writing song icon to disk:\n${err.toString()}`)
		return icon;
	}
	return save_path;
});

module.exports.save_temp_icons = () => {
	for (const kind of Object.keys(module.exports.icons)) {
		const destinationPath = path.join(userData, 'icons', `${kind}.png`);
		if (fs.existsSync(destinationPath)) continue;
		const iconPath = path.resolve(__dirname, "../../assets/media-icons-black", `${kind}.png`);
		fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
		fs.copyFile(iconPath, destinationPath, () => { });
	}
};

module.exports.snakeToCamel = (str) => {
	return str.replace(/([-_][a-z]|^[a-z])/g, (group) =>
		group.toUpperCase()
			.replace('-', ' ')
			.replace('_', ' ')
	);
}

module.exports.secondsToMinutes = (seconds) => {
	const minutes = Math.floor(seconds / 60);
	const secondsLeft = seconds % 60;
	return `${minutes}:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`;
}
