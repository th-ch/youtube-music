const downloadsFolder = require("downloads-folder");

module.exports.getFolder = (customFolder) => customFolder || downloadsFolder();
module.exports.defaultMenuDownloadLabel = "Download playlist";
