const { ElementFromFile, templatePath, triggerAction } = require("../utils");
const { ACTIONS, CHANNEL } = require("./actions.js");
const { downloadVideoToMP3 } = require("./youtube-dl");

let menu = null;
let progress = null;
const downloadButton = ElementFromFile(
	templatePath(__dirname, "download.html")
);

const observer = new MutationObserver((mutations, observer) => {
	if (!menu) {
		menu = document.querySelector("ytmusic-menu-popup-renderer paper-listbox");
	}

	if (menu && !menu.contains(downloadButton)) {
		menu.prepend(downloadButton);
		progress = document.querySelector("#ytmcustom-download");
	}
});

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
		},
		() => {
			if (!progress) {
				console.warn("Cannot update progress");
			} else {
				progress.innerHTML = "Download";
			}
		}
	);
};

function observeMenu() {
	observer.observe(document, {
		childList: true,
		subtree: true,
	});
}

module.exports = observeMenu;
