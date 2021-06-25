const { triggerAction } = require("../utils");

const CHANNEL = 'playlists'
const ACTIONS = {BUTTON: 'test-button'}

function testPlaylistButton() {
  console.log('bruh.');
  triggerAction(CHANNEL, ACTIONS.BUTTON)
}

module.exports = {
  CHANNEL,
  ACTIONS,
  actions: {
    testPlaylistButton
  }
}