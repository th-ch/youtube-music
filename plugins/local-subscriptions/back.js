const { BrowserWindow, ipcMain } = require("electron");
const path = require("path");

const { injectCSS, listenAction, templatePath } = require("../utils");
const { ACTIONS, CHANNEL } = require("./actions.js");

module.exports = win => {
  injectCSS(win.webContents, path.join(__dirname, "style.css"), () => {
		win.webContents.send("subscriptions-css-ready");
	});

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
  win.webContents.on('did-stop-loading', () => console.log('Loaded'))
  win.webContents.on('did-navigate-in-page', () => win.webContents.send('subscriptions-location-change'));
};