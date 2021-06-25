const { BrowserWindow } = require("electron");
const path = require("path");

const { injectCSS, listenAction, templatePath } = require("../utils");
const { ACTIONS, CHANNEL } = require("./actions.js");

module.exports = win => {
  listenAction(CHANNEL, (event, action) => {
    switch(action) {
      case ACTIONS.BUTTON:
        const subscriptionsWindow = new BrowserWindow({parent: win})
        subscriptionsWindow.webContents.loadFile(templatePath(__dirname, "subscriptions-menu.html"))
        break;
      default:
          console.log("Unknown action: " + action);
    }
  })
};