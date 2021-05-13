const { existsSync } = require("fs");
const path = require("path");

const { app, Menu } = require("electron");
const is = require("electron-is");

const { getAllPlugins } = require("./plugins/utils");
const config = require("./config");

const prompt = require("custom-electron-prompt");
const promptOptions = require("./providers/prompt-options");

const pluginEnabledMenu = (win, plugin, label = "", hasSubmenu = false) => ({
	label: label || plugin,
	type: "checkbox",
	checked: config.plugins.isEnabled(plugin),
	//Submenu check used in in-app-menu
	hasSubmenu: hasSubmenu || undefined,
	click: (item) => {
		if (item.checked) {
			config.plugins.enable(plugin);
		} else {
			config.plugins.disable(plugin);
		}
		if (hasSubmenu) {
			this.setApplicationMenu(win);
		}
	},
});

const mainMenuTemplate = (win) => [
	{
		label: "Plugins",
		submenu: [
			...getAllPlugins().map((plugin) => {
				const pluginPath = path.join(__dirname, "plugins", plugin, "menu.js")
				if (existsSync(pluginPath)) {
					if (!config.plugins.isEnabled(plugin)) {
						return pluginEnabledMenu(win, plugin, "", true);
					}
					const getPluginMenu = require(pluginPath);
					return {
						label: plugin,
						submenu: [
							pluginEnabledMenu(win, plugin, "Enabled", true),
							...getPluginMenu(win, config.plugins.getOptions(plugin), () =>
								module.exports.setApplicationMenu(win)
							),
						],
					};
				}

				return pluginEnabledMenu(win, plugin);
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
						}
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
					},
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
			{
				label: "Reload",
				click: () => {
					win.webContents.reload();
				},
			},
			{
				label: "Force Reload",
				click: () => {
					win.webContents.reloadIgnoringCache();
				},
			},
			{ type: "separator" },
			{
				label: "Zoom In",
				click: () => {
					win.webContents.setZoomLevel(
						win.webContents.getZoomLevel() + 1
					);
				},
			},
			{
				label: "Zoom Out",
				click: () => {
					win.webContents.setZoomLevel(
						win.webContents.getZoomLevel() - 1
					);
				},
			},
			{
				label: "Reset Zoom",
				click: () => {
					win.webContents.setZoomLevel(0);
				},
			},
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
			{
				label: "Quit App",
				click: () => {
					app.quit();
				},
			},
		],
	},
];

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

	if (output) {
		config.set("options.proxy", output);
		item.checked = output !== "";
	} else { //user pressed cancel
		item.checked = !item.checked; //reset checkbox
	}
}
