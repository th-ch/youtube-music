const path = require('node:path');

const { injectCSS } = require('../utils');

module.exports = (win) => {
  injectCSS(win.webContents, path.join(__dirname, 'style.css'));
};
