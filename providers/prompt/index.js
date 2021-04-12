const electron = require("electron");

const BrowserWindow = electron.BrowserWindow || electron.remote.BrowserWindow;
const ipcMain = electron.ipcMain || electron.remote.ipcMain;
const url = require("url");
const path = require("path");

const DEFAULT_WIDTH = 370;
const DEFAULT_HEIGHT = 160;

function electronPrompt(options, parentWindow) {
	return new Promise((resolve, reject) => {
		//id used to ensure unique listeners per window
		const id = `${Date.now()}-${Math.random()}`;

		//custom options override default
		const options_ = Object.assign(
			{
				width: DEFAULT_WIDTH,
				height: DEFAULT_HEIGHT,
				minWidth: DEFAULT_WIDTH,
				minHeight: DEFAULT_HEIGHT,
				resizable: false,
				title: "Prompt",
				label: "Please input a value:",
				buttonLabels: null,
				alwaysOnTop: false,
				value: null,
				type: "input",
				selectOptions: null,
				icon: null,
				useHtmlLabel: false,
				customStylesheet: null,
				menuBarVisible: false,
				skipTaskbar: true,
				frame: true,
				customScript: null,
				enableRemoteModule: false
			},
			options || {}
		);

		if (options_.type === "select" && (options_.selectOptions === null || typeof options_.selectOptions !== "object")) {
			reject(new Error('"selectOptions" must be an object'));
			return;
		}

		let promptWindow = new BrowserWindow({
			frame: options_.frame,
			width: options_.width,
			height: options_.height,
			minWidth: options_.minWidth,
			minHeight: options_.minHeight,
			resizable: options_.resizable,
			minimizable: !options_.skipTaskbar && !parentWindow && !options_.alwaysOnTop,
			fullscreenable: options_.resizable,
			maximizable: options_.resizable,
			parent: parentWindow,
			skipTaskbar: options_.skipTaskbar,
			alwaysOnTop: options_.alwaysOnTop,
			useContentSize: options_.resizable,
			modal: Boolean(parentWindow),
			title: options_.title,
			icon: options_.icon || undefined,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				enableRemoteModule: options_.enableRemoteModule
			}
		});

		promptWindow.setMenu(null);
		promptWindow.setMenuBarVisibility(options_.menuBarVisible);

		//called on exit
		const cleanup = () => {
			ipcMain.removeListener("prompt-get-options:" + id, getOptionsListener);
			ipcMain.removeListener("prompt-post-data:" + id, postDataListener);
			ipcMain.removeListener("prompt-error:" + id, errorListener);

			if (promptWindow) {
				promptWindow.close();
				promptWindow = null;
			}
		};

		///transfer options to front
		const getOptionsListener = event => {
			event.returnValue = JSON.stringify(options_);
		};

		//get input from front
		const postDataListener = (event, value) => {
			resolve(value);
			event.returnValue = null;
			cleanup();
		};

		const unresponsiveListener = () => {
			reject(new Error("Window was unresponsive"));
			cleanup();
		};

		//get error from front
		const errorListener = (event, message) => {
			reject(new Error(message));
			event.returnValue = null;
			cleanup();
		};

		//attach listeners
		ipcMain.on("prompt-get-options:" + id, getOptionsListener);
		ipcMain.on("prompt-post-data:" + id, postDataListener);
		ipcMain.on("prompt-error:" + id, errorListener);
		promptWindow.on("unresponsive", unresponsiveListener);

		promptWindow.on("closed", () => {
			promptWindow = null;
			cleanup();
			resolve(null);
		});

		//should never happen
		promptWindow.webContents.on("did-fail-load", (
			event,
			errorCode,
			errorDescription,
			validatedURL,		
		) => {
			const log = {
				error: "did-fail-load",
				errorCode,
				errorDescription,
				validatedURL,
			};
			reject(new Error("prompt.html did-fail-load, log:\n", + log.toString()));
		});

		//Finally, load prompt
		promptWindow.loadURL(promptUrl);
	});
}

module.exports = electronPrompt;
