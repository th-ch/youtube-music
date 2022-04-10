const { ipcRenderer } = require("electron");

const { getSongMenu } = require("../../providers/dom-elements");
const { ElementFromFile, templatePath } = require("../utils");

function $(selector) { return document.querySelector(selector); }

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
	const menuUrl = $(
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
			const minButton = $(".player-minimize-button");
			// remove native listeners
			minButton.replaceWith(minButton.cloneNode(true)); 
			$(".player-minimize-button").onclick = () =>  {
				global.togglePictureInPicture();
				setTimeout(() => $('#player').click());
			};

			// allows easily closing the menu by programmatically clicking outside of it
			$("#expanding-menu").removeAttribute("no-cancel-on-outside-click");
			// TODO: think about wether an additional button in songMenu is needed 
			observer.observe($("ytmusic-popup-container"), {
				childList: true,
				subtree: true,
			});
		},
		{ once: true, passive: true }
	);
}

module.exports = observeMenu;
