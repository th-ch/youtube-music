const path = require("path");
const is = require("electron-is");
const { isEnabled } = require("../config/plugins");

const iconPath = path.join(__dirname, "..", "assets", "youtube-music-tray.png");
const customTitlebarPath = path.join(__dirname, "prompt-custom-titlebar.js");

const promptOptions = !is.macOS() && isEnabled("in-app-menu") ? {
    customStylesheet: "dark",
    // The following are used for custom titlebar
    frame: false,
    customScript: customTitlebarPath,
} : {
    customStylesheet: "dark",
    icon: iconPath
};

module.exports = () => promptOptions;
