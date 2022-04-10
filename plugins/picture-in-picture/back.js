const path = require("path");

const { app, ipcMain } = require("electron");

const { setOptions } = require("../../config/plugins");
const { injectCSS } = require("../utils");

let isInPiP = false;
let originalPosition;
let originalSize;
let originalFullScreen;
let originalMaximized;

let win;
let options;

const pipPosition = () => (options.savePosition && options["pip-position"]) || [10, 10];
const pipSize = () => (options.saveSize && options["pip-size"]) || [450, 275];

const setLocalOptions = (_options) => {
	options = { ...options, ..._options };
	setOptions("picture-in-picture", _options);
}

const togglePiP = async () => {
	isInPiP = !isInPiP;
	setLocalOptions({ isInPiP });

	if (isInPiP) {
		originalFullScreen = win.isFullScreen();
		if (originalFullScreen) win.setFullScreen(false);
		originalMaximized = win.isMaximized();
		if (originalMaximized) win.unmaximize();
	
		originalPosition = win.getPosition();
		originalSize = win.getSize();

		win.webContents.on("before-input-event", blockShortcutsInPiP);

		win.setFullScreenable(false);
		await win.webContents.executeJavaScript(
			// Go fullscreen
			`
			var exitButton = document.querySelector(".exit-fullscreen-button");
			exitButton.replaceWith(exitButton.cloneNode(true));
			document.querySelector(".exit-fullscreen-button").onclick = () => togglePictureInPicture();

			var onPlayerDblClick = document.querySelector('#player').onDoubleClick_
			document.querySelector('#player').onDoubleClick_ = () => {};
			document.querySelector('#expanding-menu').onmouseleave = () => document.querySelector('.middle-controls').click();
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
			document.querySelector('#player').onDoubleClick_ = onPlayerDblClick;
			document.querySelector('#expanding-menu').onmouseleave = undefined;
			document.querySelector(".exit-fullscreen-button").replaceWith(exitButton);
			document.querySelector(".exit-fullscreen-button").click();
			document.querySelector("ytmusic-player-bar").classList.remove("pip");
			`
		);

		win.setVisibleOnAllWorkspaces(false);
		win.setAlwaysOnTop(false);

		if (originalFullScreen) win.setFullScreen(true);
		if (originalMaximized) win.maximize();
	}

	const [x, y] = isInPiP ? pipPosition() : originalPosition;
	const [w, h] = isInPiP ? pipSize() : originalSize;
	win.setPosition(x, y);
	win.setSize(w, h);

	win.setWindowButtonVisibility?.(!isInPiP);
};

const blockShortcutsInPiP = (event, input) => {
	const key = input.key.toLowerCase();

	if (key === "f") {
		event.preventDefault();
	} else if (key === 'escape') {
		togglePiP();
		event.preventDefault();
	};
};

module.exports = (_win, _options) => {
	options ??= _options;
	win ??= _win;
	setLocalOptions({ isInPiP });
	injectCSS(win.webContents, path.join(__dirname, "style.css"));
	ipcMain.on("picture-in-picture", async () => {
		await togglePiP();
	});
};

module.exports.setOptions = setLocalOptions;

