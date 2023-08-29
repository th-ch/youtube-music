const path = require('node:path');

const { injectCSS } = require('../utils');

module.exports = (win, options) => {
  injectCSS(win.webContents, path.join(__dirname, 'empty-player.css'));
};
