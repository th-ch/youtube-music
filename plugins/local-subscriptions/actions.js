const { triggerAction } = require("../utils");

const CHANNEL = 'local-subscriptions'
const ACTIONS = {
  SUBS_WIN_BTN: 'subscriptions-window-button',
  SUBS_LI_CLK: 'subscriptions-list-item-click'
}

function openSubscriptionsWindow() {
  triggerAction(CHANNEL, ACTIONS.SUBS_WIN_BTN)
}

function handleListItemClick(pathname) {
  triggerAction(CHANNEL, ACTIONS.SUBS_LI_CLK, pathname)
}

module.exports = {
  CHANNEL,
  ACTIONS,
  actions: {
    openSubscriptionsWindow,
    handleListItemClick
  }
};
