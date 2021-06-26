const { ipcRenderer } = require("electron");
const { ElementFromFile, templatePath } = require("../utils");

const localSubscriptionButtonHandler = () => {
  const channelName = document.querySelector('.title.style-scope.ytmusic-immersive-header-renderer').innerHTML
  ipcRenderer.send('sub-btn-clk', window.location.pathname, channelName);
}

module.exports = () => {
  ipcRenderer.on('subscriptions-css-ready', () => {
  const localPlaylistsButton = ElementFromFile(templatePath(__dirname, "subscriptions-tab.html"));
  const menu = document.querySelector("ytmusic-pivot-bar-renderer");

  if (menu) {
    menu.appendChild(localPlaylistsButton);
  }
  });

  // TODO: 
  // [x] Listen to 'did-stop-loading' event
  // [x] Check if it is a channel page
  // [x] Add subscribe button
  // [x] Think through how the subscriptions are going to get stored (electron-store, data structures)
  // [] Display subscription list in the popup window
  // [] Add comments
 
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
  })
};