const { injectCSS } = require("../utils");
const path = require("path");

module.exports = (win, options) => {
	injectCSS(win.webContents, path.join(__dirname, "empty-player.css"));
};
