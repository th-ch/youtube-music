const { contextBridge } = require("electron");

const { defaultConfig } = require("../../config");
const { getSongMenu } = require("../../providers/dom-elements");
const { ElementFromFile, templatePath, triggerAction } = require("../utils");
const { ACTIONS, CHANNEL } = require("./actions.js");
const { downloadVideoToMP3 } = require("./youtube-dl");

let menu = null;
let progress = null;
const downloadButton = ElementFromFile(
	templatePath(__dirname, "download.html")
);
let pluginOptions = {};

const observer = new MutationObserver((mutations, observer) => {
	if (!menu) {
		menu = getSongMenu();
	}

	if (menu && !menu.contains(downloadButton)) {
		menu.prepend(downloadButton);
		progress = document.querySelector("#ytmcustom-download");
	}
});

const reinit = () => {
	if (!progress) {
		console.warn("Cannot update progress");
	} else {
		progress.innerHTML = "Download";
	}
};

const baseUrl = defaultConfig.url;

// TODO: re-enable once contextIsolation is set to true
// contextBridge.exposeInMainWorld("downloader", {
// 	download: () => {
global.download = () => {
	let metadata;
	let videoUrl = getSongMenu()
		.querySelector("ytmusic-menu-navigation-item-renderer")
		.querySelector("#navigation-endpoint")
		.getAttribute("href");
	if (videoUrl) {
		videoUrl = baseUrl + "/" + videoUrl;
		metadata = null;
	} else {
		videoUrl = global.songInfo.url || window.location.href;
		metadata = global.songInfo;
	}

	downloadVideoToMP3(
		videoUrl,
		(feedback) => {
			if (!progress) {
				console.warn("Cannot update progress");
			} else {
				progress.innerHTML = feedback;
			}
		},
		(error) => {
			triggerAction(CHANNEL, ACTIONS.ERROR, error);
			reinit();
		},
		reinit,
		pluginOptions,
		metadata
	);
};
// });

function observeMenu(options) {
	pluginOptions = { ...pluginOptions, ...options };
	observer.observe(document, {
		childList: true,
		subtree: true,
	});
}

module.exports = observeMenu;
