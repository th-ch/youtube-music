const { remote, ipcRenderer } = require("electron");

const customTitlebar = require("custom-electron-titlebar");

module.exports = () => {
	const bar = new customTitlebar.Titlebar({
		backgroundColor: customTitlebar.Color.fromHex("#050505"),
		itemBackgroundColor: customTitlebar.Color.fromHex("#121212"),
		// !important - unfocus effect can sometimes cause crash as of v3.2.6 of custom-electron-titlebar
		unfocusEffect: false 
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
