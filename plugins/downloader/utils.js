const { app } = require("electron");

module.exports.getFolder = (customFolder) => customFolder || app.getPath("downloads");
module.exports.defaultMenuDownloadLabel = "Download playlist";
