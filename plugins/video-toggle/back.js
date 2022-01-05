const { injectCSS } = require("../utils");
const path = require("path");

module.exports = (win, options) => {
	if (options.forceHide) {
		injectCSS(win.webContents, path.join(__dirname, "force-hide.css"));
	} else {
		injectCSS(win.webContents, path.join(__dirname, "button-switcher.css"));
	}
};
