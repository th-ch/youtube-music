const { ipcRenderer } = require("electron");

const { toKeyEvent } = require("keyboardevent-from-electron-accelerator");
const keyEventAreEqual = require("keyboardevents-areequal");

const { getSongMenu } = require("../../providers/dom-elements");
const { ElementFromFile, templatePath } = require("../utils");

function $(selector) { return document.querySelector(selector); }

let useNativePiP = false;
let menu = null;
const pipButton = ElementFromFile(
	templatePath(__dirname, "picture-in-picture.html")
);

// will also clone
function replaceButton(query, button) {
	const svg = button.querySelector("#icon svg").cloneNode(true);
	button.replaceWith(button.cloneNode(true));
	button.remove();
	const newButton = $(query);
	newButton.querySelector("#icon").appendChild(svg);
	return newButton;
}

function cloneButton(query) {
	replaceButton(query, $(query));
	return $(query);
}

const observer = new MutationObserver(() => {
	if (!menu) {
		menu = getSongMenu();
		if (!menu) return;
	}
	if (menu.contains(pipButton) || !menu.parentElement.eventSink_?.matches('ytmusic-menu-renderer.ytmusic-player-bar')) return;
	const menuUrl = $(
		'tp-yt-paper-listbox [tabindex="0"] #navigation-endpoint'
	)?.href;
	if (menuUrl && !menuUrl.includes("watch?")) return;

	menu.prepend(pipButton);
});

global.togglePictureInPicture = async () => {
	if (useNativePiP) {
		const isInPiP = document.pictureInPictureElement !== null;
		const video = $("video");
		const togglePiP = () =>
			isInPiP
				? document.exitPictureInPicture.call(document)
				: video.requestPictureInPicture.call(video);

		try {
			await togglePiP();
			$("#icon").click(); // Close the menu
			return true;
		} catch {}
	}

	ipcRenderer.send("picture-in-picture");
	return false;
};

const listenForToggle = () => {
	const originalExitButton = $(".exit-fullscreen-button");
	const appLayout = $("ytmusic-app-layout");
	const expandMenu = $('#expanding-menu');
	const middleControls = $('.middle-controls');
	const playerPage = $("ytmusic-player-page");
	const togglePlayerPageButton = $(".toggle-player-page-button");
	const fullScreenButton = $(".fullscreen-button");
	const player = $('#player');
	const onPlayerDblClick = player.onDoubleClick_;

	const titlebar = $(".cet-titlebar");

	ipcRenderer.on("pip-toggle", (_, isPip) => {
		if (isPip) {
			replaceButton(".exit-fullscreen-button", originalExitButton).onclick =
				() => togglePictureInPicture();
			player.onDoubleClick_ = () => {};
			expandMenu.onmouseleave = () => middleControls.click();
			if (!playerPage.playerPageOpen_) {
				togglePlayerPageButton.click();
			}
			fullScreenButton.click();
			appLayout.classList.add("pip");
			if (titlebar) titlebar.style.display = "none";
		} else {
			$(".exit-fullscreen-button").replaceWith(originalExitButton);
			player.onDoubleClick_ = onPlayerDblClick;
			expandMenu.onmouseleave = undefined;
			originalExitButton.click();
			appLayout.classList.remove("pip");
			if (titlebar) titlebar.style.display = "flex";
		}
	});
}

function observeMenu(options) {
	useNativePiP = options.useNativePiP;
	document.addEventListener(
		"apiLoaded",
		() => {
			listenForToggle();

			cloneButton(".player-minimize-button").onclick = async () => {
				await global.togglePictureInPicture();
				setTimeout(() => $("#player").click());
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

module.exports = (options) => {
	observeMenu(options);

	if (options.hotkey) {
		const hotkeyEvent = toKeyEvent(options.hotkey);
		window.addEventListener("keydown", (event) => {
			if (
				keyEventAreEqual(event, hotkeyEvent) &&
				!$("ytmusic-search-box").opened
			) {
				togglePictureInPicture();
			}
		});
	}
};
