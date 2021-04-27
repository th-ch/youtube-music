const electron = require("electron");

const BrowserWindow = electron.BrowserWindow || electron.remote.BrowserWindow;
const ipcMain = electron.ipcMain || electron.remote.ipcMain;
const url = require("url");
const path = require("path");

const DEFAULT_WIDTH = 370;
const DEFAULT_KEYBIND_WIDTH = 420;
const DEFAULT_COUNTER_WIDTH = 300;
const DEFAULT_HEIGHT = 150;
const DEFAULT_KEYBIND_HEIGHT = options => (options.length * 40) + 100;

function electronPrompt(options, parentWindow) {
	return new Promise((resolve, reject) => {
		//id used to ensure unique listeners per window
		const id = `${Date.now()}-${Math.random()}`;

		//custom options override default
		const options_ = Object.assign(
			{
				width: options?.type === "counter" ? DEFAULT_COUNTER_WIDTH : options?.type === "keybind" ? DEFAULT_KEYBIND_WIDTH : DEFAULT_WIDTH,
				height: options?.type === "keybind" && options?.keybindOptions ? DEFAULT_KEYBIND_HEIGHT(options.keybindOptions) : DEFAULT_HEIGHT,
				resizable: false,
				title: "Prompt",
				label: "Please input a value:",
				buttonLabels: null,
				alwaysOnTop: false,
				value: null,
				type: "input",
				selectOptions: null,
				keybindOptions: null,
				counterOptions: { minimum: null, maximum: null, multiFire: false },
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



		if (options_.customStylesheet === "dark") {
			options_.customStylesheet = require("path").join(__dirname, "dark-prompt.css");
		}

		for (let type of ["counter", "select", "keybind"]) {
			if (options_.type === type && (!options_[`${type}Options`] || typeof options_[`${type}Options`] !== "object")) {
				reject(new Error(`"${type}Options" must be an object if type = ${type}`));
				return;
			}
		}

		options_.minWidth = options?.minWidth || options?.width || options_.width;
		options_.minHeight = options?.minHeight || options?.height || options_.height;

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
			if (options_.type === "keybind" && value) {
				for (let i=0; i < value.length ;i++) {
					value[i] = JSON.parse(value[i])
				}
			}
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
			_event,
			errorCode,
			errorDescription,
			validatedURL
		) => {
			const log = {
				error: "did-fail-load",
				errorCode,
				errorDescription,
				validatedURL
			};
			reject(new Error("prompt.html did-fail-load, log:\n" + log.toString()));
		});

		const promptUrl = url.format({
			protocol: "file",
			slashes: true,
			pathname: path.join(__dirname, "page", "prompt.html"),
			hash: id
		});

		//Finally, load prompt
		promptWindow.loadURL(promptUrl);
	});
}

module.exports = electronPrompt;
