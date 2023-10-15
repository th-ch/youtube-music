import { ipcRenderer } from 'electron';

import forwardHTML from './templates/forward.html';
import backHTML from './templates/back.html';

import { ElementFromHtml } from '../utils';

export function run() {
  ipcRenderer.on('navigation-css-ready', () => {
    const forwardButton = ElementFromHtml(forwardHTML);
    const backButton = ElementFromHtml(backHTML);
    const menu = document.querySelector('#right-content');

    if (menu) {
      menu.prepend(backButton, forwardButton);
    }
  });
}

export default run;
