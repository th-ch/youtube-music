const electron = require("electron");

module.exports.getFolder = (customFolder) =>
	customFolder || (electron.app || electron.remote.app).getPath("downloads");
module.exports.defaultMenuDownloadLabel = "Download playlist";

module.exports.UrlToJPG = (imgUrl, videoId) => {
	if (!imgUrl || imgUrl.includes(".jpg")) return imgUrl;
	if (imgUrl.includes("maxresdefault")) {
		return "https://img.youtube.com/vi/"+videoId+"/maxresdefault.jpg";
	}
	if (imgUrl.includes("hqdefault")) {
		return "https://img.youtube.com/vi/"+videoId+"/hqdefault.jpg";
	} //it will almost never get further than hq
	if (imgUrl.includes("mqdefault")) {
		return "https://img.youtube.com/vi/"+videoId+"/mqdefault.jpg";
	}
	if (imgUrl.includes("sdddefault")) {
		return "https://img.youtube.com/vi/"+videoId+"/sdddefault.jpg";
	}
	return "https://img.youtube.com/vi/"+videoId+"/default.jpg";
}

module.exports.cropMaxWidth = (image) => {
	const imageSize = image.getSize();
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
