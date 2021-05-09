const path = require("path");
const is = require("electron-is");

const iconPath = path.resolve(__dirname, "../assets/youtube-music-tray.png");
const customTitlebarPath = path.join(__dirname, "prompt-custom-titlebar.js");

const promptOptions = is.macOS() ? {
    customStylesheet: "dark",
    icon: iconPath
} : {
    customStylesheet: "dark",
    icon: iconPath,
    // The following are used for custom titlebar
    frame: false,
    customScript: customTitlebarPath,
    enableRemoteModule: true
};

module.exports = () => promptOptions;
