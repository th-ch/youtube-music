const path = require("path");

const { remote } = require("electron");

const config = require("./config");
const { fileExists } = require("./plugins/utils");
const setupFrontLogger = require("./providers/front-logger");
const setupSongInfo = require("./providers/song-info-front");
const { setupSongControls } = require("./providers/song-controls-front");

const plugins = config.plugins.getEnabled();

let api;

plugins.forEach(([plugin, options]) => {
	const preloadPath = path.join(__dirname, "plugins", plugin, "preload.js");
	fileExists(preloadPath, () => {
		const run = require(preloadPath);
		run(options);
	});

	const actionPath = path.join(__dirname, "plugins", plugin, "actions.js");
	fileExists(actionPath, () => {
		const actions = require(actionPath).actions || {};

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

	// wait for complete load of youtube api
	listenForApiLoad();

	// inject song-info provider
	setupSongInfo();

	// inject song-controls
	setupSongControls();

	// inject front logger
	setupFrontLogger();

	// Add action for reloading
	global.reload = () =>
		remote.getCurrentWindow().webContents.loadURL(config.get("url"));

	// Blocks the "Are You Still There?" popup by setting the last active time to Date.now every 15min
	setInterval(() => window._lact = Date.now(), 900000);
});

function listenForApiLoad() {
	api = document.querySelector('#movie_player');
	if (api) {
		onApiLoaded();
		return;
	}

	const observer = new MutationObserver(() => {
		api = document.querySelector('#movie_player');
		if (api) {
			observer.disconnect();
			onApiLoaded();
		}
	})

	observer.observe(document.documentElement, { childList: true, subtree: true });
}

function onApiLoaded() {
	document.dispatchEvent(new CustomEvent('apiLoaded', { detail: api }));

	// Remove upgrade button
	if (config.get("options.removeUpgradeButton")) {
		const upgradeButtton = document.querySelector('ytmusic-pivot-bar-item-renderer[tab-id="SPunlimited"]')
		if (upgradeButtton) {
			upgradeButtton.style.display = "none";
		}
	}
}
