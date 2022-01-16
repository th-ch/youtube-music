const { ipcRenderer } = require("electron");

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

const observer = new MutationObserver(() => {
	if (!menu) {
		menu = getSongMenu();
		if (!menu) return;
	}
	if (menu.contains(downloadButton)) return;
	const menuUrl = document.querySelector('tp-yt-paper-listbox [tabindex="0"] #navigation-endpoint')?.href;
	if (menuUrl && !menuUrl.includes('watch?')) return;

	menu.prepend(downloadButton);
	progress = document.querySelector("#ytmcustom-download");
});

const reinit = () => {
	triggerAction(CHANNEL, ACTIONS.PROGRESS, -1); // closes progress bar
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
	triggerAction(CHANNEL, ACTIONS.PROGRESS, 2); // starts with indefinite progress bar
	let metadata;
	let videoUrl = getSongMenu()
		// selector of first button which is always "Start Radio"
		?.querySelector('ytmusic-menu-navigation-item-renderer[tabindex="0"] #navigation-endpoint')
		?.getAttribute("href");
	if (videoUrl) {
		if (videoUrl.startsWith('watch?')) {
			videoUrl = baseUrl + "/" + videoUrl;
		}
		if (videoUrl.includes('?playlist=')) {
			ipcRenderer.send('download-playlist-request', videoUrl);
			return;
		}
		metadata = null;
	} else {
		metadata = global.songInfo;
		videoUrl = metadata.url || window.location.href;
	}

	downloadVideoToMP3(
		videoUrl,
		(feedback, ratio = undefined) => {
			if (!progress) {
				console.warn("Cannot update progress");
			} else {
				progress.innerHTML = feedback;
			}
			if (ratio) {
				triggerAction(CHANNEL, ACTIONS.PROGRESS, ratio);
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

	document.addEventListener('apiLoaded', () => {
		observer.observe(document.querySelector('ytmusic-popup-container'), {
			childList: true,
			subtree: true,
		});
	}, { once: true, passive: true })
}

module.exports = observeMenu;
