// This file generates the detector buffer
const fs      = require("fs");
const path    = require("path");
const Blocker = require("ad-block");
const https   = require("https");

const SOURCES = [
	"https://raw.githubusercontent.com/kbinani/adblock-youtube-ads/master/signed.txt"
];

function parseAdblockList(client, adblockList) {
	const urls      = adblockList.split("\n");
	const totalSize = urls.length;
	console.log(
		"Parsing " + totalSize + " urls (this can take a couple minutes)."
	);
	urls.map(line => client.parse(line));
	console.log("Created buffer.");
}

function writeBuffer(client) {
	const output = path.resolve(__dirname, "detector.buffer");
	fs.writeFile(output, client.serialize(64), err => {
		if (err) {
			console.error(err);
			return;
		}
		console.log("Wrote buffer to detector.buffer!");
	});
}

function generateDetectorBuffer() {
	const client           = new Blocker.AdBlockClient();
	let   nbSourcesFetched = 0;

	// fetch updated versions
	SOURCES.forEach(source => {
		console.log("Downloading " + source);
		https
			.get(source, resp => {
				let data = "";

				// A chunk of data has been recieved.
				resp.on("data", chunk => {
					data += chunk;
				});

				// The whole response has been received. Print out the result.
				resp.on("end", () => {
					parseAdblockList(client, data);
					nbSourcesFetched++;

					if (nbSourcesFetched === SOURCES.length) {
						writeBuffer(client);
					}
				});
			})
			.on("error", err => {
				console.log("Error: " + err.message);
			});
	});
}

module.exports = generateDetectorBuffer;
if (require.main === module) {
	generateDetectorBuffer();
}
