const path = require('node:path');

const { injectCSS } = require('../utils');

module.exports = (win, options) => {
  if (options.forceHide) {
    injectCSS(win.webContents, path.join(__dirname, 'force-hide.css'));
  } else if (!options.mode || options.mode === 'custom') {
    injectCSS(win.webContents, path.join(__dirname, 'button-switcher.css'));
  }
};
