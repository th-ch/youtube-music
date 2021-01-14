const { contextBridge } = require("electron");

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
		menu = document.querySelector("ytmusic-menu-popup-renderer paper-listbox");
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

// TODO: re-enable once contextIsolation is set to true
// contextBridge.exposeInMainWorld("downloader", {
// 	download: () => {
global.download = () => {
	const videoUrl = window.location.href;

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
		pluginOptions
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
