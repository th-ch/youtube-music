// This file downloads the configured adblock lists
const fs = require("fs");
const https = require("https");
const path = require("path");

const SOURCES = [
	{
		name: "youtube-ads",
		url:
			"https://raw.githubusercontent.com/kbinani/adblock-youtube-ads/master/signed.txt"
	}
];

function downloadAdblockLists(sources = SOURCES) {
	// fetch updated versions
	sources.forEach(source => {
		console.log(`Downloading list "${source.name}" (${source.url})`);
		https
			.get(source.url, response => {
				const filepath = path.resolve(
					__dirname,
					"filter-lists",
					`${source.name}.txt`
				);
				const file = fs.createWriteStream(filepath);
				response.pipe(file);
			})
			.on("error", err => {
				console.log("Error: " + err.message);
			});
	});
}

module.exports = downloadAdblockLists;
if (require.main === module) {
	downloadAdblockLists();
}
