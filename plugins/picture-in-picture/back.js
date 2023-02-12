const path = require("path");

const { app, ipcMain } = require("electron");
const electronLocalshortcut = require("electron-localshortcut");

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

		win.setMaximizable(false);
		win.setFullScreenable(false);

		win.webContents.send("pip-toggle", true);

		app.dock?.hide();
		win.setVisibleOnAllWorkspaces(true, {
			visibleOnFullScreen: true,
		});
		app.dock?.show();
		if (options.alwaysOnTop) {
			win.setAlwaysOnTop(true, "screen-saver", 1);
		}
	} else {
		win.webContents.removeListener("before-input-event", blockShortcutsInPiP);
		win.setMaximizable(true);
		win.setFullScreenable(true);

		win.webContents.send("pip-toggle", false);

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
