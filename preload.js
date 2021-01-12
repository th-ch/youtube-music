const path = require("path");

const { contextBridge, remote } = require("electron");

const config = require("./config");
const { fileExists } = require("./plugins/utils");

const plugins = config.plugins.getEnabled();

plugins.forEach(([plugin, options]) => {
	const pluginPath = path.join(__dirname, "plugins", plugin, "actions.js");
	fileExists(pluginPath, () => {
		const actions = require(pluginPath).actions || {};
		contextBridge.exposeInMainWorld(plugin + "Actions", actions);
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

	// Add action for reloading
	global.reload = () =>
		remote.getCurrentWindow().webContents.loadURL(config.get("url"));
});
