const path = require("path");

const { app, ipcMain } = require("electron");

const { setOptions } = require("../../config/plugins");
const { injectCSS } = require("../utils");

let isInPiPMode = false;
let originalPosition;
let originalSize;

const pipPosition = [10, 10];
const pipSize = [450, 275];

const togglePiP = async (win) => {
	isInPiPMode = !isInPiPMode;
	setOptions("picture-in-picture", { isInPiP: isInPiPMode });

	if (isInPiPMode) {
		originalPosition = win.getPosition();
		originalSize = win.getSize();

		win.webContents.on("before-input-event", blockShortcutsInPiP);

		win.setFullScreenable(false);
		await win.webContents.executeJavaScript(
			// Go fullscreen
			`
			if (!document.querySelector("ytmusic-player-page").playerPageOpen_) {
  				document.querySelector(".toggle-player-page-button").click();
			}
			document.querySelector(".fullscreen-button").click();
			document.querySelector("ytmusic-player-bar").classList.add("pip");
			`
		);
		win.setFullScreenable(true);

		app.dock?.hide();
		win.setVisibleOnAllWorkspaces(true, {
			visibleOnFullScreen: true,
		});
		app.dock?.show();
		win.setAlwaysOnTop(true, "screen-saver", 1);
	} else {
		win.webContents.removeListener("before-input-event", blockShortcutsInPiP);

		await win.webContents.executeJavaScript(
			// Exit fullscreen
			`
			document.querySelector(".exit-fullscreen-button").click();
			document.querySelector("ytmusic-player-bar").classList.remove("pip");
			`
		);

		win.setVisibleOnAllWorkspaces(false);
		win.setAlwaysOnTop(false);
	}

	const [x, y] = isInPiPMode ? pipPosition : originalPosition;
	const [w, h] = isInPiPMode ? pipSize : originalSize;
	win.setPosition(x, y);
	win.setSize(w, h);

	win.setWindowButtonVisibility?.(!isInPiPMode);
};

module.exports = (win) => {
	injectCSS(win.webContents, path.join(__dirname, "style.css"));
	ipcMain.on("picture-in-picture", async () => {
		await togglePiP(win);
	});
};

const blockShortcutsInPiP = (event, input) => {
	const blockedShortcuts = ["f", "escape"];
	if (blockedShortcuts.includes(input.key.toLowerCase())) {
		event.preventDefault();
	}
};
