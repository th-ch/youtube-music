const { app, Menu } = require("electron");
const is = require("electron-is");

const { getAllPlugins } = require("./plugins/utils");
const {
	isPluginEnabled,
	enablePlugin,
	disablePlugin,
	autoUpdate,
	hideMenu,
	isAppVisible,
	isTrayEnabled,
	setOptions,
	startAtLogin,
	disableHardwareAcceleration,
} = require("./store");

const mainMenuTemplate = (win) => [
	{
		label: "Plugins",
		submenu: getAllPlugins().map((plugin) => {
			return {
				label: plugin,
				type: "checkbox",
				checked: isPluginEnabled(plugin),
				click: (item) => {
					if (item.checked) {
						enablePlugin(plugin);
					} else {
						disablePlugin(plugin);
					}
				},
			};
		}),
	},
	{
		label: "Options",
		submenu: [
			{
				label: "Auto-update",
				type: "checkbox",
				checked: autoUpdate(),
				click: (item) => {
					setOptions({ autoUpdates: item.checked });
				},
			},
			{
				label: "Disable hardware acceleration",
				type: "checkbox",
				checked: disableHardwareAcceleration(),
				click: (item) => {
					setOptions({ disableHardwareAcceleration: item.checked });
				},
			},
			...(is.windows() || is.linux()
				? [
						{
							label: "Hide menu",
							type: "checkbox",
							checked: hideMenu(),
							click: (item) => {
								setOptions({ hideMenu: item.checked });
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
							checked: startAtLogin(),
							click: (item) => {
								setOptions({ startAtLogin: item.checked });
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
						checked: !isTrayEnabled(),
						click: () => setOptions({ tray: false, appVisible: true }),
					},
					{
						label: "Enabled + app visible",
						type: "radio",
						checked: isTrayEnabled() && isAppVisible(),
						click: () => setOptions({ tray: true, appVisible: true }),
					},
					{
						label: "Enabled + app hidden",
						type: "radio",
						checked: isTrayEnabled() && !isAppVisible(),
						click: () => setOptions({ tray: true, appVisible: false }),
					},
				],
			},
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
