const { injectCSS } = require("../utils");
const path = require("path");

module.exports = win => {
	injectCSS(win.webContents, path.join(__dirname, "style.css"));
};
