const config = require("./config");
const { fileExists } = require("./plugins/utils");
const setupSongInfo = require("./providers/song-info-front");
const { setupSongControls } = require("./providers/song-controls-front");
const { ipcRenderer } = require("electron");
const is = require("electron-is");

const { startingPages } = require("./providers/extracted-data");

const plugins = config.plugins.getEnabled();

const $ = document.querySelector.bind(document);

let api;

plugins.forEach(async ([plugin, options]) => {
	const preloadPath = await ipcRenderer.invoke(
		"getPath",
		__dirname,
		"plugins",
		plugin,
		"preload.js"
	);
	fileExists(preloadPath, () => {
		const run = require(preloadPath);
		run(options);
	});

	const actionPath = await ipcRenderer.invoke(
		"getPath",
		__dirname,
		"plugins",
		plugin,
		"actions.js"
	);
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
	plugins.forEach(async ([plugin, options]) => {
		const pluginPath = await ipcRenderer.invoke(
			"getPath",
			__dirname,
			"plugins",
			plugin,
			"front.js"
		);
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

	// Add action for reloading
	global.reload = () => ipcRenderer.send('reload');

	// Blocks the "Are You Still There?" popup by setting the last active time to Date.now every 15min
	setInterval(() => window._lact = Date.now(), 900000);

	// setup back to front logger
	if (is.dev()) {
		ipcRenderer.on("log", (_event, log) => {
			console.log(JSON.parse(log));
		});
	}
});

function listenForApiLoad() {
	api = $('#movie_player');
	if (api) {
		onApiLoaded();
		return;
	}

	const observer = new MutationObserver(() => {
		api = $('#movie_player');
		if (api) {
			observer.disconnect();
			onApiLoaded();
		}
	})

	observer.observe(document.documentElement, { childList: true, subtree: true });
}

function onApiLoaded() {
	const video = $("video");
	const audioContext = new AudioContext();
	const audioSource = audioContext.createMediaElementSource(video);
	audioSource.connect(audioContext.destination);

	video.addEventListener(
		"loadstart",
		() => {
			// Emit "audioCanPlay" for each video
			video.addEventListener(
				"canplaythrough",
				() => {
					document.dispatchEvent(
						new CustomEvent("audioCanPlay", {
							detail: {
								audioContext: audioContext,
								audioSource: audioSource,
							},
						})
					);
				},
				{ once: true }
			);
		},
		{ passive: true }
	);

	document.dispatchEvent(new CustomEvent('apiLoaded', { detail: api }));
	ipcRenderer.send('apiLoaded');

	// Navigate to "Starting page"
	const startingPage = config.get("options.startingPage");
	if (startingPage && startingPages[startingPage]) {
		$('ytmusic-app')?.navigate_(startingPages[startingPage]);
	}

	// Remove upgrade button
	if (config.get("options.removeUpgradeButton")) {
		const upgradeButton = $('ytmusic-pivot-bar-item-renderer[tab-id="SPunlimited"]')
		if (upgradeButton) {
			upgradeButton.style.display = "none";
		}
	}


	// Hide / Force show like buttons
	const likeButtonsOptions = config.get("options.likeButtons");
	if (likeButtonsOptions) {
		const likeButtons = $("ytmusic-like-button-renderer");
		if (likeButtons) {
			likeButtons.style.display =
				{
					hide: "none",
					force: "inherit",
				}[likeButtonsOptions] || "";
		}
	}
}
