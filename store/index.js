const Store = require("electron-store");
const plugins = require("./plugins");

const store = new Store({
	defaults: {
		"window-size": {
			width: 1100,
			height: 550
		},
		url: "https://music.youtube.com",
		plugins: ["navigation", "shortcuts", "adblocker"],
	}
});

module.exports = {
	store: store,
	isPluginEnabled: plugin => plugins.isEnabled(store, plugin),
	getEnabledPlugins: () => plugins.getEnabledPlugins(store),
	enablePlugin: plugin => plugins.enablePlugin(store, plugin),
	disablePlugin: plugin => plugins.disablePlugin(store, plugin),
};
