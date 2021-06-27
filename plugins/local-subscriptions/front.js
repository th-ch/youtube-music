const { ipcRenderer } = require("electron");
const { ElementFromFile, templatePath } = require("../utils");

// Send channel data to 'back' on 'sub-btn-clk' channel
const localSubscriptionButtonHandler = () => {
  const channelName = document.querySelector('.title.style-scope.ytmusic-immersive-header-renderer').innerHTML
  ipcRenderer.send('sub-btn-clk', window.location.pathname, channelName);
}

module.exports = () => {
  // On css load add local subscriptions button to the menu
  ipcRenderer.on('subscriptions-css-ready', () => {
  const localSubscriptionsButton = ElementFromFile(templatePath(__dirname, "subscriptions-tab.html"));
  const menu = document.querySelector("ytmusic-pivot-bar-renderer");

  if (menu) {
    menu.appendChild(localSubscriptionsButton);
  }
  });
 
  // On page loading finnish check if it is a channel page
  // If it is add sub button to the page
  ipcRenderer.on('subscriptions-page-stop-loading', () => {
    const isChannelPage = window.location.pathname.includes('channel');

    if (isChannelPage) {
      const buttons = document.querySelector(".buttons.style-scope.ytmusic-immersive-header-renderer");
      if (buttons) {
        const localSubscriptionButton = document.createElement('button')
        localSubscriptionButton.innerText = 'Local Subscription'
        localSubscriptionButton.onclick = localSubscriptionButtonHandler;
        buttons.appendChild(localSubscriptionButton);
      }
    }
  });
};