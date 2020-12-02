const Store = require("electron-store");
const plugins = require("./plugins");

const store = new Store({
	defaults: {
		"window-size": {
			width: 1100,
			height: 550,
		},
		url: "https://music.youtube.com",
		plugins: ["navigation", "shortcuts", "adblocker"],
		options: {
			tray: false,
			appVisible: true,
			autoUpdates: true,
			hideMenu: false,
			startAtLogin: false,
			disableHardwareAcceleration: false,
		},
	},
});

module.exports = {
	store: store,
	// Plugins
	isPluginEnabled: plugin => plugins.isEnabled(store, plugin),
	getEnabledPlugins: () => plugins.getEnabledPlugins(store),
	enablePlugin: plugin => plugins.enablePlugin(store, plugin),
	disablePlugin: plugin => plugins.disablePlugin(store, plugin),
	// Options
	setOptions: options =>
		store.set("options", { ...store.get("options"), ...options }),
	isTrayEnabled: () => store.get("options.tray"),
	isAppVisible: () => store.get("options.appVisible"),
	autoUpdate: () => store.get("options.autoUpdates"),
	hideMenu: () => store.get("options.hideMenu"),
	startAtLogin: () => store.get("options.startAtLogin"),
	disableHardwareAcceleration: () =>
		store.get("options.disableHardwareAcceleration"),
};
