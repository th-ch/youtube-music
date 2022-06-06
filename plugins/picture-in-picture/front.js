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

const listenForToggle = () => {
	const originalExitButton = $(".exit-fullscreen-button");
	const clonedExitButton = originalExitButton.cloneNode(true);
	clonedExitButton.onclick = () => togglePictureInPicture();

	const appLayout = $("ytmusic-app-layout");
	const expandMenu = $('#expanding-menu');
	const middleControls = $('.middle-controls');
	const playerPage = $("ytmusic-player-page");
	const togglePlayerPageButton = $(".toggle-player-page-button");
	const fullScreenButton = $(".fullscreen-button");
	const player = $('#player');
	const onPlayerDblClick = player.onDoubleClick_;

	ipcRenderer.on('pip-toggle', (_, isPip) => {
		if (isPip) {
			$(".exit-fullscreen-button").replaceWith(clonedExitButton);
			player.onDoubleClick_ = () => {};
			expandMenu.onmouseleave = () => middleControls.click();
			if (!playerPage.playerPageOpen_) {
				togglePlayerPageButton.click();
			}
			fullScreenButton.click();
			appLayout.classList.add("pip");
		} else {
			$(".exit-fullscreen-button").replaceWith(originalExitButton);
			player.onDoubleClick_ = onPlayerDblClick;
			expandMenu.onmouseleave = undefined;
			originalExitButton.click();
			appLayout.classList.remove("pip");
		}
	});
}

function observeMenu(options) {
	document.addEventListener(
		"apiLoaded",
		() => {
			listenForToggle();
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
