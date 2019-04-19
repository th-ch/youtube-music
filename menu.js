const { app, Menu } = require("electron");

const { getAllPlugins }                                = require("./plugins/utils");
const { isPluginEnabled, enablePlugin, disablePlugin } = require("./store");

module.exports.setApplicationMenu = () => {
	const menuTemplate = [
		{
			label  : "Plugins",
			submenu: getAllPlugins().map(plugin => {
				return {
					label  : plugin,
					type   : "checkbox",
					checked: isPluginEnabled(plugin),
					click  : item => {
						if (item.checked) {
							enablePlugin(plugin);
						} else {
							disablePlugin(plugin);
						}
					}
				};
			})
		}
	];

	if (process.platform === "darwin") {
		const name = app.getName();
		menuTemplate.unshift({
			label  : name,
			submenu: [
				{ role: "about" },
				{ type: "separator" },
				{ role: "hide" },
				{ role: "hideothers" },
				{ role: "unhide" },
				{ type: "separator" },
				{
					label      : "Select All",
					accelerator: "CmdOrCtrl+A",
					selector   : "selectAll:"
				},
				{ label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
				{ label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
				{ label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
				{ type: "separator" },
				{ role: "minimize" },
				{ role: "close" },
				{ role: "quit" }
			]
		});
	}

	const menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);
};
