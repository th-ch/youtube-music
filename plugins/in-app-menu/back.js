const path = require("path");

const electronLocalshortcut = require("electron-localshortcut");

const config = require("../../config");
const { injectCSS } = require("../utils");

//tracks menu visibility
let visible = true;

module.exports = (win) => {
	// css for custom scrollbar + disable drag area(was causing bugs)
	injectCSS(win.webContents, path.join(__dirname, "style.css"));

	win.once("ready-to-show", () => {
		//register keyboard shortcut && hide menu if hideMenu is enabled
		if (config.get("options.hideMenu")) {
			electronLocalshortcut.register(win, "Esc", () => {
				setMenuVisibility(!visible);
			});
		}
	});

	win.webContents.once("did-finish-load", () => {
		// fix bug with menu not applying on start when no internet connection available
		setMenuVisibility(!config.get("options.hideMenu"));
	});

	function setMenuVisibility(value) {
		visible = value;
		win.webContents.send("updateMenu", visible);
	}
};
