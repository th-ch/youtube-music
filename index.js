"use strict";
const path = require("path");

const electron        = require("electron");
const is              = require("electron-is");
const { autoUpdater } = require("electron-updater");

const { setApplicationMenu }       = require("./menu");
const { getEnabledPlugins, store } = require("./store");
const { fileExists, injectCSS }    = require("./plugins/utils");

const app = electron.app;

// Adds debug features like hotkeys for triggering dev tools and reload
require("electron-debug")();

// Prevent window being garbage collected
let mainWindow;
autoUpdater.autoDownload = false;

let icon = "assets/youtube-music.png";
if (process.platform == "win32") {
	icon = "assets/generated/icon.ico";
} else if (process.platform == "darwin") {
	icon = "assets/generated/icon.icns";
}

function onClosed() {
	// Dereference the window
	// For multiple windows store them in an array
	mainWindow = null;
}

function createMainWindow() {
	const windowSize      = store.get("window-size");
	const windowMaximized = store.get("window-maximized");

	const win = new electron.BrowserWindow({
		icon           : icon,
		width          : windowSize.width,
		height         : windowSize.height,
		backgroundColor: "#000",
		show           : false,
		webPreferences : {
			nodeIntegration: false,
			preload        : path.join(__dirname, "preload.js")
		},
		frame        : false,
		titleBarStyle: "hiddenInset"
	});
	if (windowMaximized) {
		win.maximize();
	}

	win.webContents.loadURL(store.get("url"));
	win.on("closed", onClosed);

	injectCSS(win.webContents, path.join(__dirname, "youtube-music.css"));
	win.webContents.on("did-finish-load", () => {
		if (is.dev()) {
			console.log("did finish load");
			win.webContents.openDevTools();
		}
	});

	getEnabledPlugins().forEach(plugin => {
		console.log("Loaded plugin - " + plugin);
		const pluginPath = path.join(__dirname, "plugins", plugin, "back.js");
		fileExists(pluginPath, () => {
			const handle = require(pluginPath);
			handle(win);
		});
	});

	win.webContents.on("did-fail-load", () => {
		if (is.dev()) {
			console.log("did fail load");
		}
		win.webContents.loadFile(path.join(__dirname, "error.html"));
	});

	win.webContents.on("did-navigate-in-page", () => {
		const url = win.webContents.getURL();
		if (url.startsWith("https://music.youtube.com")) {
			store.set("url", url);
		}
	});

	win.on("move", () => {
		let position = win.getPosition();
		store.set("window-position", { x: position[0], y: position[1] });
	});

	win.on("resize", () => {
		const windowSize = win.getSize();

		store.set("window-maximized", win.isMaximized());
		if (!win.isMaximized()) {
			store.set("window-size", { width: windowSize[0], height: windowSize[1] });
		}
	});

	win.once("ready-to-show", () => {
		win.show();
	});

	return win;
}

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}

	// Unregister all shortcuts.
	electron.globalShortcut.unregisterAll();
});

app.on("activate", () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		mainWindow = createMainWindow();
	} else if (!mainWindow.isVisible()) {
		mainWindow.show();
	}
});

app.on("ready", () => {
	setApplicationMenu();
	mainWindow = createMainWindow();
	if (!is.dev()) {
		autoUpdater.checkForUpdatesAndNotify();
		autoUpdater.on("update-available", () => {
			const dialogOpts = {
				type   : "info",
				buttons: ["OK"],
				title  : "Application Update",
				message: "A new version is available",
				detail : 
					"A new version is available and can be downloaded at https://github.com/th-ch/youtube-music/releases/latest"
			};
			electron.dialog.showMessageBox(dialogOpts);
		});
	}

	// Optimized for Mac OS X
	if (process.platform === "darwin") {
		var forceQuit = false;
		app.on("before-quit", () => {
			forceQuit = true;
		});
		mainWindow.on("close", event => {
			if (!forceQuit) {
				event.preventDefault();
				mainWindow.hide();
			}
		});
	}
});
