const { remote, ipcRenderer } = require("electron");

const customTitlebar = require("custom-electron-titlebar");

module.exports = () => {
	const bar = new customTitlebar.Titlebar({
		backgroundColor: customTitlebar.Color.fromHex("#050505"),
		itemBackgroundColor: customTitlebar.Color.fromHex("#121212"),
	});
	bar.updateTitle(" ");
	document.title = "Youtube Music";

	ipcRenderer.on("updateMenu", function (event, menu) {
		if (menu) {
			bar.updateMenu(remote.Menu.getApplicationMenu());
		} else {
			try {
				bar.updateMenu(null);
			} catch (e) {
				//will always throw type error - null isn't menu, but it works
			}
		}
	});
};
