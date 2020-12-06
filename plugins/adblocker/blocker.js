const { promises } = require("fs"); // used for caching
const path = require("path");

const { ElectronBlocker } = require("@cliqz/adblocker-electron");
const fetch = require("node-fetch");

const SOURCES = [
	"https://raw.githubusercontent.com/kbinani/adblock-youtube-ads/master/signed.txt",
];

const loadAdBlockerEngine = (
	session = undefined,
	cache = true,
	additionalBlockLists = []
) => {
	// Only use cache if no additional blocklists are passed
	const cachingOptions =
		cache && additionalBlockLists.length === 0
			? {
					path: path.resolve(__dirname, "ad-blocker-engine.bin"),
					read: promises.readFile,
					write: promises.writeFile,
			  }
			: undefined;

	ElectronBlocker.fromLists(
		fetch,
		[...SOURCES, ...additionalBlockLists],
		{},
		cachingOptions
	)
		.then((blocker) => {
			if (session) {
				blocker.enableBlockingInSession(session);
			} else {
				console.log("Successfully generated adBlocker engine.");
			}
		})
		.catch((err) => console.log("Error loading adBlocker engine", err));
};

module.exports = { loadAdBlockerEngine };
if (require.main === module) {
	loadAdBlockerEngine(); // Generate the engine without enabling it
}
