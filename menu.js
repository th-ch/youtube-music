const { app, Menu } = require("electron");

const { getAllPlugins } = require("./plugins/utils");
const {
	isPluginEnabled,
	enablePlugin,
	disablePlugin,
	autoUpdate,
	isAppVisible,
	isTrayEnabled,
	setOptions,
} = require("./store");

const mainMenuTemplate = [
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
		],
	},
];

module.exports.mainMenuTemplate = mainMenuTemplate;
module.exports.setApplicationMenu = () => {
	const menuTemplate = [...mainMenuTemplate];
	if (process.platform === "darwin") {
		const name = app.getName();
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
