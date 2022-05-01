const { ipcRenderer } = require("electron");

const { getSongMenu } = require("../../providers/dom-elements");
const { ElementFromFile, templatePath } = require("../utils");

let menu = null;
const pipButton = ElementFromFile(
	templatePath(__dirname, "picture-in-picture.html")
);

const observer = new MutationObserver(() => {
	if (!menu) {
		menu = getSongMenu();
		if (!menu) return;
	}
	if (menu.contains(pipButton)) return;
	const menuUrl = document.querySelector(
		'tp-yt-paper-listbox [tabindex="0"] #navigation-endpoint'
	)?.href;
	if (menuUrl && !menuUrl.includes("watch?")) return;

	menu.prepend(pipButton);
});

global.togglePictureInPicture = () => {
	ipcRenderer.send("picture-in-picture");
};

function observeMenu(options) {
	document.addEventListener(
		"apiLoaded",
		() => {
			observer.observe(document.querySelector("ytmusic-popup-container"), {
				childList: true,
				subtree: true,
			});
		},
		{ once: true, passive: true }
	);
}

module.exports = observeMenu;
