const { injectCSS } = require("../utils");
const path = require("path");
const { urlToHttpOptions } = require("url");

module.exports = (win, options) => {
    if (options.forceHide) {
		injectCSS(win.webContents, path.join(__dirname, "forceHide.css"));
	} else {
		injectCSS(win.webContents, path.join(__dirname, "buttonSwitcher.css"));
	}
};
