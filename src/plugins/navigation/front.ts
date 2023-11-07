import forwardHTML from './templates/forward.html?raw';
import backHTML from './templates/back.html?raw';

import { ElementFromHtml } from '../utils-renderer';

export function run() {
  window.ipcRenderer.on('navigation-css-ready', () => {
    const forwardButton = ElementFromHtml(forwardHTML);
    const backButton = ElementFromHtml(backHTML);
    const menu = document.querySelector('#right-content');

    if (menu) {
      menu.prepend(backButton, forwardButton);
    }
  });
}

export default run;
