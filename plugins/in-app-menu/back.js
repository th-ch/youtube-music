const path = require("path");

const electronLocalshortcut = require("electron-localshortcut");

const config = require("../../config");
const { injectCSS } = require("../utils");

const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main');
setupTitlebar();

//tracks menu visibility
let visible = !config.get("options.hideMenu");

module.exports = (win) => {
	// css for custom scrollbar + disable drag area(was causing bugs)
	injectCSS(win.webContents, path.join(__dirname, "style.css"));

	win.once("ready-to-show", () => {
		attachTitlebarToWindow(win);

		//register keyboard shortcut && hide menu if hideMenu is enabled
		if (config.get("options.hideMenu")) {
			electronLocalshortcut.register(win, "Esc", () => {
				setMenuVisibility(!visible);
			});
		}
	});

	function setMenuVisibility(value) {
		visible = value;
		win.webContents.send("refreshMenu", visible);
	}
};
