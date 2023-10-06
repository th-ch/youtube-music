import path from 'node:path';

import { BrowserWindow } from 'electron';

import { ACTIONS, CHANNEL } from './actions';

import { injectCSS, listenAction } from '../utils';

export function handle(win: BrowserWindow) {
  injectCSS(win.webContents, path.join(__dirname, 'style.css'), () => {
    win.webContents.send('navigation-css-ready');
  });

  listenAction(CHANNEL, (_, action) => {
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

export default handle;
