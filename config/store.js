const { dialog } = require("electron");
const Store = require("electron-store");

const defaults = require("./defaults");

module.exports = new Store({
	defaults,
	clearInvalidConfig: false,
	migrations: {
		">=1.7.0": (store) => {
			const enabledPlugins = store.get("plugins");
			if (!Array.isArray(enabledPlugins)) {
				console.warn("Plugins are not in array format, cannot migrate");
				return;
			}

			const plugins = {};
			enabledPlugins.forEach((enabledPlugin) => {
				plugins[enabledPlugin] = {
					enabled: true,
				};
			});
			store.set("plugins", plugins);
		},
	},
});
