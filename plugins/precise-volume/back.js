const { injectCSS } = require("../utils");
const path = require("path");

/*
This is used to determine if plugin is actually active
(not if its only enabled in options)
*/
let enabled = false;

module.exports = (win) => {
    enabled = true;
    injectCSS(win.webContents, path.join(__dirname, "volume-hud.css"));
}

module.exports.enabled = () => enabled;
