const Store = require("electron-store");

const defaults = require("./defaults");

const migrations = {
	">=1.7.0": (store) => {
		const enabledPlugins = store.get("plugins");
		if (!Array.isArray(enabledPlugins)) {
			console.warn("Plugins are not in array format, cannot migrate");
			return;
		}

		// Include custom options
		const plugins = {
			adblocker: {
				enabled: true,
				cache: true,
				additionalBlockLists: [],
			},
			downloader: {
				enabled: false,
				ffmpegArgs: [], // e.g. ["-b:a", "192k"] for an audio bitrate of 192kb/s
				downloadFolder: undefined, // Custom download folder (absolute path)
			},
		};
		enabledPlugins.forEach((enabledPlugin) => {
			plugins[enabledPlugin] = {
				...plugins[enabledPlugin],
				enabled: true,
			};
		});
		store.set("plugins", plugins);
	},
};

module.exports = new Store({
	defaults,
	clearInvalidConfig: false,
	migrations,
});
