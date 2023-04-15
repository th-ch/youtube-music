const { existsSync } = require("fs");
const path = require("path");

const { app, clipboard, Menu, dialog } = require("electron");
const is = require("electron-is");
const { restart } = require("./providers/app-controls");

const { getAllPlugins } = require("./plugins/utils");
const config = require("./config");
const { startingPages } = require("./providers/extracted-data");

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
			win.webContents.send("refreshMenu");
		}
	}
	return [
		{
			label: "Plugins",
			submenu: [
				...getAllPlugins().map((plugin) => {
					const pluginPath = path.join(__dirname, "plugins", plugin, "menu.js")
					if (existsSync(pluginPath)) {
						let pluginLabel = plugin;
						if (pluginLabel === "crossfade") {
							pluginLabel = "crossfade [beta]";
						}
						if (!config.plugins.isEnabled(plugin)) {
							return pluginEnabledMenu(plugin, pluginLabel, true, refreshMenu);
						}
						const getPluginMenu = require(pluginPath);
						return {
							label: pluginLabel,
							submenu: [
								pluginEnabledMenu(plugin, "Enabled", true, refreshMenu),
								{ type: "separator" },
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
						config.setMenuOption("options.autoUpdates", item.checked);
					},
				},
				{
					label: "Resume last song when app starts",
					type: "checkbox",
					checked: config.get("options.resumeOnStart"),
					click: (item) => {
						config.setMenuOption("options.resumeOnStart", item.checked);
					},
				},
				{
					label: 'Starting page',
					submenu: Object.keys(startingPages).map((name) => ({
						label: name,
						type: 'radio',
						checked: config.get('options.startingPage') === name,
						click: () => {
							config.set('options.startingPage', name);
						},
					}))
				},
				{
					label: "Visual Tweaks",
					submenu: [
						{
							label: "Remove upgrade button",
							type: "checkbox",
							checked: config.get("options.removeUpgradeButton"),
							click: (item) => {
								config.setMenuOption("options.removeUpgradeButton", item.checked);
							},
						},
						{
							label: "Like buttons",
							submenu: [
								{
									label: "Default",
									type: "radio",
									checked: !config.get("options.likeButtons"),
									click: () => {
										config.set("options.likeButtons", '');
									},
								},
								{
									label: "Force show",
									type: "radio",
									checked: config.get("options.likeButtons") === 'force',
									click: () => {
										config.set("options.likeButtons", 'force');
									}
								},
								{
									label: "Hide",
									type: "radio",
									checked: config.get("options.likeButtons") === 'hide',
									click: () => {
										config.set("options.likeButtons", 'hide');
									}
								},
							],
						},
						{
							label: "Theme",
							submenu: [
								{
									label: "No theme",
									type: "radio",
									checked: !config.get("options.themes"), // todo rename "themes"
									click: () => {
										config.set("options.themes", []);
									},
								},
								{ type: "separator" },
								{
									label: "Import custom CSS file",
									type: "radio",
									checked: false,
									click: async () => {
										const { filePaths } = await dialog.showOpenDialog({
											filters: [{ name: "CSS Files", extensions: ["css"] }],
											properties: ["openFile", "multiSelections"],
										});
										if (filePaths) {
											config.set("options.themes", filePaths);
										}
									},
								},
							],
						},
					],
				},
				{
					label: "Single instance lock",
					type: "checkbox",
					checked: true,
					click: (item) => {
						if (!item.checked && app.hasSingleInstanceLock())
							app.releaseSingleInstanceLock();
						else if (item.checked && !app.hasSingleInstanceLock())
							app.requestSingleInstanceLock();
					},
				},
				{
					label: "Always on top",
					type: "checkbox",
					checked: config.get("options.alwaysOnTop"),
					click: (item) => {
						config.setMenuOption("options.alwaysOnTop", item.checked);
						win.setAlwaysOnTop(item.checked);
					},
				},
				...(is.windows() || is.linux()
					? [
						{
							label: "Hide menu",
							type: "checkbox",
							checked: config.get("options.hideMenu"),
							click: (item) => {
								config.setMenuOption("options.hideMenu", item.checked);
								if (item.checked && !config.get("options.hideMenuWarned")) {
									dialog.showMessageBox(win, {
										type: 'info', title: 'Hide Menu Enabled',
										message: "Menu will be hidden on next launch, use [Alt] to show it (or backtick [`] if using in-app-menu)"
									});
								}
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
								config.setMenuOption("options.startAtLogin", item.checked);
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
								config.setMenuOption("options.tray", false);
								config.setMenuOption("options.appVisible", true);
							},
						},
						{
							label: "Enabled + app visible",
							type: "radio",
							checked:
								config.get("options.tray") && config.get("options.appVisible"),
							click: () => {
								config.setMenuOption("options.tray", true);
								config.setMenuOption("options.appVisible", true);
							},
						},
						{
							label: "Enabled + app hidden",
							type: "radio",
							checked:
								config.get("options.tray") && !config.get("options.appVisible"),
							click: () => {
								config.setMenuOption("options.tray", true);
								config.setMenuOption("options.appVisible", false);
							},
						},
						{ type: "separator" },
						{
							label: "Play/Pause on click",
							type: "checkbox",
							checked: config.get("options.trayClickPlayPause"),
							click: (item) => {
								config.setMenuOption("options.trayClickPlayPause", item.checked);
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
							label: "Override useragent",
							type: "checkbox",
							checked: config.get("options.overrideUserAgent"),
							click: (item) => {
								config.setMenuOption("options.overrideUserAgent", item.checked);
							}
						},
						{
							label: "Disable hardware acceleration",
							type: "checkbox",
							checked: config.get("options.disableHardwareAcceleration"),
							click: (item) => {
								config.setMenuOption("options.disableHardwareAcceleration", item.checked);
							},
						},
						{
							label: "Restart on config changes",
							type: "checkbox",
							checked: config.get("options.restartOnConfigChanges"),
							click: (item) => {
								config.setMenuOption("options.restartOnConfigChanges", item.checked);
							},
						},
						{
							label: "Reset App cache when app starts",
							type: "checkbox",
							checked: config.get("options.autoResetAppCache"),
							click: (item) => {
								config.setMenuOption("options.autoResetAppCache", item.checked);
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
				{ type: "separator" },
				{ role: "togglefullscreen" },
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
					label: "Copy current URL",
					click: () => {
						const currentURL = win.webContents.getURL();
						clipboard.writeText(currentURL);
					},
				},
				{
					label: "Restart App",
					click: restart
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
		config.setMenuOption("options.proxy", output);
		item.checked = output !== "";
	} else { //user pressed cancel
		item.checked = !item.checked; //reset checkbox
	}
}
