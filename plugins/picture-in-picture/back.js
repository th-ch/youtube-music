const path = require("path");

const { app, ipcMain } = require("electron");

const { injectCSS } = require("../utils");

let isInPiPMode = false;
let originalPosition;
let originalSize;

const pipPosition = [10, 10];
const pipSize = [400, 220];

const togglePiP = async (win) => {
	isInPiPMode = !isInPiPMode;

	if (isInPiPMode) {
		injectCSS(win.webContents, path.join(__dirname, "style.css"));

		originalPosition = win.getPosition();
		originalSize = win.getSize();

		win.setFullScreenable(false);
		await win.webContents.executeJavaScript(
			// Go fullscreen
			`document.querySelector(".fullscreen-button").click()`
		);

		app.dock?.hide();
		win.setVisibleOnAllWorkspaces(true, {
			visibleOnFullScreen: true,
		});
		app.dock.show();
		win.setAlwaysOnTop(true, "screen-saver", 1);
	} else {
		win.setFullScreenable(true);
		await win.webContents.executeJavaScript(
			// Exit fullscreen
			`document.querySelector(".exit-fullscreen-button").click()`
		);

		win.setVisibleOnAllWorkspaces(false);
		win.setAlwaysOnTop(false);
	}

	const [x, y] = isInPiPMode ? pipPosition : originalPosition;
	const [w, h] = isInPiPMode ? pipSize : originalSize;
	win.setPosition(x, y);
	win.setSize(w, h);

	win.setWindowButtonVisibility(!isInPiPMode);
};

module.exports = (win) => {
	ipcMain.on("picture-in-picture", async () => {
		await togglePiP(win);
	});
};
