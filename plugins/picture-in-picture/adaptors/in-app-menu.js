const { Menu, app } = require("electron");
const { setApplicationMenu } = require("../../../menu");

module.exports = (win, options, setOptions, togglePip, isInPip) => {
	if (isInPip) {
		Menu.setApplicationMenu(Menu.buildFromTemplate([
			{
				label: "App",
				submenu: [
					{
						label: "Exit Picture in Picture",
						click: togglePip,
					},
					{
						label: "Always on top",
						type: "checkbox",
						checked: options.alwaysOnTop,
						click: (item) => {
							setOptions({ alwaysOnTop: item.checked });
							win.setAlwaysOnTop(item.checked);
						},
					},
					{
						label: "Restart",
						click: () => {
							app.relaunch();
							app.quit();
						},
					},
					{ role: "quit" },
				],
			},
		]));
	} else {
		setApplicationMenu(win);
	}
};
