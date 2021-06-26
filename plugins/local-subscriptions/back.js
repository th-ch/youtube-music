const { BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");
const { getOptions, setOptions } = require("../../config/plugins");

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
  ipcMain.on('sub-btn-clk', (event, pathname, channelName) => {
    const currentSubscriptions = getOptions('local-subscriptions');
    const newSubscription = {[pathname]: {channelName, subDate: new Date()}}
    const didSubscribe = !!currentSubscriptions.subscriptions[pathname];

    if (didSubscribe) {
      delete currentSubscriptions.subscriptions[pathname];
      setOptions('local-subscriptions', {...currentSubscriptions})
    } else {
      setOptions('local-subscriptions', {...currentSubscriptions, 
        subscriptions: {...currentSubscriptions.subscriptions, ...newSubscription}});
    }
  })

  win.webContents.on('did-stop-loading', () => win.webContents.send('subscriptions-page-stop-loading'))
  win.webContents.on('did-navigate-in-page', () => win.webContents.send('subscriptions-location-change'));
};