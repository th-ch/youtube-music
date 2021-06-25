const { ipcRenderer } = require("electron");
const { ElementFromFile, templatePath } = require("../utils");

module.exports = () => {
  ipcRenderer.on("navigation-css-ready", () => {
  const localPlaylistsButton = ElementFromFile(templatePath(__dirname, "subscriptions-tab.html"));
  const menu = document.querySelector("ytmusic-pivot-bar-renderer");

  if (menu) {
    menu.appendChild(localPlaylistsButton);
  }
  });
};