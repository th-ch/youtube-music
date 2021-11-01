const { BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const defaultConfig = require("../../config/defaults");
const { getOptions, setOptions } = require("../../config/plugins");

const { injectCSS, listenAction, templatePath } = require("../utils");
const { ACTIONS, CHANNEL } = require("./actions.js");

let subscriptionsWindow;

module.exports = win => {
  // inject CSS in main window
  injectCSS(win.webContents, path.join(__dirname, "style.css"), () => {
		win.webContents.send("subscriptions-css-ready");
	});

  listenAction(CHANNEL, (event, action, data) => {
    switch(action) {
      // Open new window and send there local subscriptions from options
      case ACTIONS.SUBS_WIN_BTN:
        subscriptionsWindow = new BrowserWindow({
          parent: win, 
          webPreferences: {
            preload: path.join(__dirname, "popup.js"),
            affinity: "main-window"
          }})
        subscriptionsWindow.loadFile(templatePath(__dirname, "subscriptions-menu.html"))
        subscriptionsWindow.webContents.on('did-stop-loading', () => subscriptionsWindow.webContents.send('saved-subscriptions', getOptions('local-subscriptions').subscriptions))
        break;
      case ACTIONS.SUBS_LI_CLK:
        subscriptionsWindow.close();
        console.log(action)
        win.loadURL(defaultConfig.url + data);
        break;
      default:
          console.log("Unknown action: " + action);
    }
  })

  // Handles sub button click and saves changes in options
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
