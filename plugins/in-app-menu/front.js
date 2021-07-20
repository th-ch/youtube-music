const { remote, ipcRenderer } = require("electron");

const customTitlebar = require("custom-electron-titlebar");

module.exports = () => {
	const bar = new customTitlebar.Titlebar({
		backgroundColor: customTitlebar.Color.fromHex("#050505"),
		itemBackgroundColor: customTitlebar.Color.fromHex("#121212"),
	});
	bar.updateTitle(" ");
	document.title = "Youtube Music";

	ipcRenderer.on("updateMenu", function (_event, showMenu) {
		bar.updateMenu(showMenu ? remote.Menu.getApplicationMenu() : null);
	});
};
