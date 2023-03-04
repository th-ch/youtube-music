const { ipcRenderer } = require("electron");

const { defaultConfig } = require("../../config");
const { getSongMenu } = require("../../providers/dom-elements");
const { ElementFromFile, templatePath } = require("../utils");

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
	if (!menuUrl?.includes('watch?')) return;

	menu.prepend(downloadButton);
	progress = document.querySelector("#ytmcustom-download");
});

const baseUrl = defaultConfig.url;

// TODO: re-enable once contextIsolation is set to true
// contextBridge.exposeInMainWorld("downloader", {
// 	download: () => {
global.download = () => {
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

	ipcRenderer.invoke('download-song', videoUrl);
	return;
};

function observeMenu(options) {
	pluginOptions = { ...pluginOptions, ...options };

	document.addEventListener('apiLoaded', () => {
		observer.observe(document.querySelector('ytmusic-popup-container'), {
			childList: true,
			subtree: true,
		});
	}, { once: true, passive: true })

	ipcRenderer.on('downloader-feedback', (_, feedback) => {
		if (!progress) {
			console.warn("Cannot update progress");
		} else {
			progress.innerHTML = feedback || "Download";
		}
	});
}

module.exports = observeMenu;
