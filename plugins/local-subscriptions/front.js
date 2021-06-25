const { ipcRenderer } = require("electron");
const { ElementFromFile, templatePath } = require("../utils");

module.exports = () => {
  ipcRenderer.on('subscriptions-css-ready', () => {
  const localPlaylistsButton = ElementFromFile(templatePath(__dirname, "subscriptions-tab.html"));
  const menu = document.querySelector("ytmusic-pivot-bar-renderer");

  if (menu) {
    menu.appendChild(localPlaylistsButton);
  }
  });

  // TODO: 
  // * Listen to 'did-stop-loading' event
  // * Check if it is a channel page
  // * Add subscribe button
  // * Think through how the subscriptions are going to get stored (electron-store, data structures)
  // * Display subscription list in the popup window

  ipcRenderer.on('subscriptions-location-change', (event) => {
    const isChannelPage = window.location.pathname.includes('channel');
    console.log('Is this page a channel?', isChannelPage)

      // const channelButtonsObserver = new MutationObserver((mutations, observer) => {
      //   const buttons = document.getElementsByClassName(".buttons .style-scope .ytmusic-immersive-header-renderer")[0];
      //   if (buttons) {
      //     const localSubscriptionButton = document.createElement('button')
      //     console.log(buttons);
      //     buttons.appendChild(localSubscriptionButton);
      //     observer.disconnect();
      //   }
      // })
      // if (window.location.pathname.includes('channel')) {
      //   channelButtonsObserver.observe(document, {childList: true, subtree: true});
      // } else {
      //   channelButtonsObserver.disconnect();
      // }
      // watchDOMElement(
      //   'buttonsss', 
      //   (document) => document.getElementsByClassName("div.buttons.style-scope.ytmusic-immersive-header-renderer")[0],
      //   (buttonsElement, mutations, observer) => {
      //     if (buttonsElement) {
      //       const localSubscriptionButton = document.createElement('button')
      //       console.log(buttonsElement);
      //       buttonsElement.appendChild(localSubscriptionButton);
      //       observer.disconnect();
      //     }
      //   })
      // const buttons = document.querySelector("div.buttons.style-scope.ytmusic-immersive-header-renderer");
      // const localSubscriptionButton = document.createElement('button')
      // console.log(buttons);
      // if (buttons) {
      //   buttons.appendChild(localSubscriptionButton)
      // } else {
      //   console.log('No Buttons Found.')
      // }
  })

  // ipcRenderer.on('subscriptions-location-change', () => {
  //   const isChannelPage = window.location.pathname.includes('channel');
  //   console.log('Is this page a channel?', isChannelPage)

  //   if (isChannelPage) {
  //     ipcRenderer.on('subscriptions-dom-ready', () => {
  //       const buttons = document.querySelector("div.buttons.style-scope.ytmusic-immersive-header-renderer");
  //       const localSubscriptionButton = document.createElement('button')
  //       console.log(buttons);
  //       if (buttons) {
  //         buttons.appendChild(localSubscriptionButton)
  //       } else {
  //         console.log('No Buttons Found.')
  //       }
  //       ipcRenderer.removeListener('subscriptions-dom-ready');
  //     })
  //   }
  // })
};