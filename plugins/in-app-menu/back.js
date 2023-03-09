const path = require("path");

const electronLocalshortcut = require("electron-localshortcut");

const { injectCSS } = require("../utils");

const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main');
setupTitlebar();

//tracks menu visibility

module.exports = (win) => {
	// css for custom scrollbar + disable drag area(was causing bugs)
	injectCSS(win.webContents, path.join(__dirname, "style.css"));

	win.once("ready-to-show", () => {
		attachTitlebarToWindow(win);

		electronLocalshortcut.register(win, "`", () => {
			win.webContents.send("toggleMenu");
		});
	});
};
