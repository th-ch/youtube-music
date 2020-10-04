const path = require("path");

const { remote } = require("electron");

const { getEnabledPlugins, store } = require("./store");
const { fileExists }               = require("./plugins/utils");

const plugins = getEnabledPlugins();

plugins.forEach(plugin => {
	const pluginPath = path.join(__dirname, "plugins", plugin, "actions.js");
	fileExists(pluginPath, () => {
		const actions = require(pluginPath).global || {};
		Object.keys(actions).forEach(actionName => {
			global[actionName] = actions[actionName];
		});
	});
});

document.addEventListener("DOMContentLoaded", () => {
	plugins.forEach(plugin => {
		const pluginPath = path.join(__dirname, "plugins", plugin, "front.js");
		fileExists(pluginPath, () => {
			const run = require(pluginPath);
			run();
		});
	});

	// Add action for reloading
	global.reload = () =>
		remote.getCurrentWindow().webContents.loadURL(store.get("url"));
});
