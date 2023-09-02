const path = require('node:path');

const { ACTIONS, CHANNEL } = require('./actions.ts');

const { injectCSS, listenAction } = require('../utils');

function handle(win) {
  injectCSS(win.webContents, path.join(__dirname, 'style.css'), () => {
    win.webContents.send('navigation-css-ready');
  });

  listenAction(CHANNEL, (event, action) => {
    switch (action) {
      case ACTIONS.NEXT: {
        if (win.webContents.canGoForward()) {
          win.webContents.goForward();
        }

        break;
      }

      case ACTIONS.BACK: {
        if (win.webContents.canGoBack()) {
          win.webContents.goBack();
        }

        break;
      }

      default: {
        console.log('Unknown action: ' + action);
      }
    }
  });
}

module.exports = handle;
