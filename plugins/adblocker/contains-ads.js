const fs = require("fs");
const path = require("path");

const AdBlockClient = require("adblock-rs");
const is = require("electron-is");

const sourcesFolder = path.resolve(__dirname, "filter-lists");
const filterLists = fs
	.readdirSync(sourcesFolder)
	.filter(filename => filename.includes(".txt"))
	.map(filename =>
		fs
			.readFileSync(path.resolve(sourcesFolder, filename), {
				encoding: "utf-8"
			})
			.split("\n")
	);

const rules = [].concat(...filterLists);
const debug = is.dev();
const client = new AdBlockClient.Engine(rules, debug);

if (debug) {
	const serializedArrayBuffer = client.serialize(); // Serialize the engine to an ArrayBuffer
	console.log(
		`AdBlock engine size: ${(serializedArrayBuffer.byteLength / 1024).toFixed(
			2
		)} KB`
	);
}

module.exports.containsAds = (req, base) => client.check(req, base || "", "");
