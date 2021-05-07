const electron = require("electron");

module.exports.getFolder = (customFolder) =>
	customFolder || (electron.app || electron.remote.app).getPath("downloads");
module.exports.defaultMenuDownloadLabel = "Download playlist";
