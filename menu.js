const { existsSync } = require("fs");
const path = require("path");

const { app, Menu } = require("electron");
const is = require("electron-is");

const { getAllPlugins } = require("./plugins/utils");
const config = require("./config");

const prompt = require("custom-electron-prompt");
const promptOptions = require("./providers/prompt-options");

// true only if in-app-menu was loaded on launch
const inAppMenuActive = config.plugins.isEnabled("in-app-menu");

const pluginEnabledMenu = (plugin, label = "", hasSubmenu = false, refreshMenu = undefined) => ({
	label: label || plugin,
	type: "checkbox",
	checked: config.plugins.isEnabled(plugin),
	click: (item) => {
		if (item.checked) {
			config.plugins.enable(plugin);
		} else {
			config.plugins.disable(plugin);
		}
		if (hasSubmenu) {
			refreshMenu();
		}
	},
});

const mainMenuTemplate = (win) => {
	const refreshMenu = () => {
		this.setApplicationMenu(win);
		if (inAppMenuActive) {
			win.webContents.send("updateMenu", true);
		}
	}
	return [
		{
			label: "Plugins",
			submenu: [
				...getAllPlugins().map((plugin) => {
					const pluginPath = path.join(__dirname, "plugins", plugin, "menu.js")
					if (existsSync(pluginPath)) {
						if (!config.plugins.isEnabled(plugin)) {
							return pluginEnabledMenu(plugin, "", true, refreshMenu);
						}
						const getPluginMenu = require(pluginPath);
						return {
							label: plugin,
							submenu: [
								pluginEnabledMenu(plugin, "Enabled", true, refreshMenu),
								...getPluginMenu(win, config.plugins.getOptions(plugin), refreshMenu),
							],
						};
					}

					return pluginEnabledMenu(plugin);
				}),
			],
		},
		{
			label: "Options",
			submenu: [
				{
					label: "Auto-update",
					type: "checkbox",
					checked: config.get("options.autoUpdates"),
					click: (item) => {
						config.set("options.autoUpdates", item.checked);
					},
				},
				{
					label: "Resume last song when app starts",
					type: "checkbox",
					checked: config.get("options.resumeOnStart"),
					click: (item) => {
						config.set("options.resumeOnStart", item.checked);
					},
				},
				{
					label: "Remove upgrade button",
					type: "checkbox",
					checked: config.get("options.removeUpgradeButton"),
					click: (item) => {
						config.set("options.removeUpgradeButton", item.checked);
					},
				},
				...(is.windows() || is.linux()
					? [
						{
							label: "Hide menu",
							type: "checkbox",
							checked: config.get("options.hideMenu"),
							click: (item) => {
								config.set("options.hideMenu", item.checked);
							},
						},
					]
					: []),
				...(is.windows() || is.macOS()
					? // Only works on Win/Mac
					// https://www.electronjs.org/docs/api/app#appsetloginitemsettingssettings-macos-windows
					[
						{
							label: "Start at login",
							type: "checkbox",
							checked: config.get("options.startAtLogin"),
							click: (item) => {
								config.set("options.startAtLogin", item.checked);
							},
						},
					]
					: []),
				{
					label: "Tray",
					submenu: [
						{
							label: "Disabled",
							type: "radio",
							checked: !config.get("options.tray"),
							click: () => {
								config.set("options.tray", false);
								config.set("options.appVisible", true);
							},
						},
						{
							label: "Enabled + app visible",
							type: "radio",
							checked:
								config.get("options.tray") && config.get("options.appVisible"),
							click: () => {
								config.set("options.tray", true);
								config.set("options.appVisible", true);
							},
						},
						{
							label: "Enabled + app hidden",
							type: "radio",
							checked:
								config.get("options.tray") && !config.get("options.appVisible"),
							click: () => {
								config.set("options.tray", true);
								config.set("options.appVisible", false);
							},
						},
						{ type: "separator" },
						{
							label: "Play/Pause on click",
							type: "checkbox",
							checked: config.get("options.trayClickPlayPause"),
							click: (item) => {
								config.set("options.trayClickPlayPause", item.checked);
							},
						},
					],
				},
				{ type: "separator" },
				{
					label: "Advanced options",
					submenu: [
            	{
						label: "Proxy",
						type: "checkbox",
						checked: !!config.get("options.proxy"),
						click: (item) => {
							setProxy(item, win);
						  },
					  },
						{
							label: "Disable hardware acceleration",
							type: "checkbox",
							checked: config.get("options.disableHardwareAcceleration"),
							click: (item) => {
								config.set("options.disableHardwareAcceleration", item.checked);
							},
						},
						{
							label: "Restart on config changes",
							type: "checkbox",
							checked: config.get("options.restartOnConfigChanges"),
							click: (item) => {
								config.set("options.restartOnConfigChanges", item.checked);
							},
						},
						{
							label: "Reset App cache when app starts",
							type: "checkbox",
							checked: config.get("options.autoResetAppCache"),
							click: (item) => {
								config.set("options.autoResetAppCache", item.checked);
							},
						},
						{ type: "separator" },
						is.macOS() ?
							{
								label: "Toggle DevTools",
								// Cannot use "toggleDevTools" role in MacOS
								click: () => {
									const { webContents } = win;
									if (webContents.isDevToolsOpened()) {
										webContents.closeDevTools();
									} else {
										const devToolsOptions = {};
										webContents.openDevTools(devToolsOptions);
									}
								},
							} :
							{ role: "toggleDevTools" },
						{
							label: "Edit config.json",
							click: () => {
								config.edit();
							},
						},
					]
				},
			],
		},
		{
			label: "View",
			submenu: [
				{ role: "reload" },
				{ role: "forceReload" },
				{ type: "separator" },
				{ role: "zoomIn" },
				{ role: "zoomOut" },
				{ role: "resetZoom" },
			],
		},
		{
			label: "Navigation",
			submenu: [
				{
					label: "Go back",
					click: () => {
						if (win.webContents.canGoBack()) {
							win.webContents.goBack();
						}
					},
				},
				{
					label: "Go forward",
					click: () => {
						if (win.webContents.canGoForward()) {
							win.webContents.goForward();
						}
					},
				},
				{
					label: "Restart App",
					click: () => {
						app.relaunch();
						app.quit();
					},
				},
				{ role: "quit" },
			],
		},
	];
}

module.exports.mainMenuTemplate = mainMenuTemplate;
module.exports.setApplicationMenu = (win) => {
	const menuTemplate = [...mainMenuTemplate(win)];
	if (process.platform === "darwin") {
		const name = app.name;
		menuTemplate.unshift({
			label: name,
			submenu: [
				{ role: "about" },
				{ type: "separator" },
				{ role: "hide" },
				{ role: "hideothers" },
				{ role: "unhide" },
				{ type: "separator" },
				{
					label: "Select All",
					accelerator: "CmdOrCtrl+A",
					selector: "selectAll:",
				},
				{ label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
				{ label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
				{ label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
				{ type: "separator" },
				{ role: "minimize" },
				{ role: "close" },
				{ role: "quit" },
			],
		});
	}

	const menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);
};

async function setProxy(item, win) {
	const output = await prompt({
		title: 'Set Proxy',
		label: 'Enter Proxy Address: (leave empty to disable)',
		value: config.get("options.proxy"),
		type: 'input',
		inputAttrs: {
			type: 'url',
			placeholder: "Example: 'socks5://127.0.0.1:9999"
		},
		width: 450,
		...promptOptions()
	}, win);

	if (typeof output === "string") {
		config.set("options.proxy", output);
		item.checked = output !== "";
	} else { //user pressed cancel
		item.checked = !item.checked; //reset checkbox
	}
}
