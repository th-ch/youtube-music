const path = require("path");

const { contextBridge, remote } = require("electron");

const config = require("./config");
const { fileExists } = require("./plugins/utils");

const plugins = config.plugins.getEnabled();

plugins.forEach(([plugin, options]) => {
	const pluginPath = path.join(__dirname, "plugins", plugin, "actions.js");
	fileExists(pluginPath, () => {
		const actions = require(pluginPath).actions || {};

		// TODO: re-enable once contextIsolation is set to true
		// contextBridge.exposeInMainWorld(plugin + "Actions", actions);
		Object.keys(actions).forEach((actionName) => {
			global[actionName] = actions[actionName];
		});
	});
});

document.addEventListener("DOMContentLoaded", () => {
	plugins.forEach(([plugin, options]) => {
		const pluginPath = path.join(__dirname, "plugins", plugin, "front.js");
		fileExists(pluginPath, () => {
			const run = require(pluginPath);
			run(options);
		});
	});

	// inject song-info provider
	const songInfoProviderPath = path.join(__dirname, "providers", "song-info-front.js")
	fileExists(songInfoProviderPath, require(songInfoProviderPath));

	// inject front logger
	require("./providers/front-logger")();

	// Add action for reloading
	global.reload = () =>
		remote.getCurrentWindow().webContents.loadURL(config.get("url"));
});
