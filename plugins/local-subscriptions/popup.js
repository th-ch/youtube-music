const { ipcRenderer, contextBridge } = require("electron");
const { ElementFromHtml } = require("../utils");
const {handleListItemClick} =require('./actions').actions;


// Couldn't manage to attach actions to global object
// Only contextBridge have worked

// const actions = require('./actions.js').actions || {};
//   Object.keys(actions).forEach((actionName) => {
//     console.log(actionName);
//     globalThis.API = {};
//     globalThis.API[actionName] = actions[actionName];
//   })

contextBridge.exposeInMainWorld('SUBS_WIN', {
  handleListItemClick
})

// Load subscriptions in a list on window load
ipcRenderer.on('saved-subscriptions', (evt, subs) => {
  const subList = document.getElementById('subscriptions-list');

  if (subList) {
    Object.keys(subs).forEach(subKey => {
      const sub = subs[subKey];
      const subEl = ElementFromHtml(`<li data-pathname="${subKey}" onclick="window.SUBS_WIN.handleListItemClick('${subKey}')">${sub.channelName} | ${sub.subDate}</a></li>`);
      subList.appendChild(subEl);
    })
  }
})