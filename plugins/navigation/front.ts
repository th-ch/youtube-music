import { ipcRenderer } from 'electron';

import { ElementFromFile, templatePath } from '../utils';

export function run() {
  ipcRenderer.on('navigation-css-ready', () => {
    const forwardButton = ElementFromFile(
      templatePath(__dirname, 'forward.html'),
    );
    const backButton = ElementFromFile(templatePath(__dirname, 'back.html'));
    const menu = document.querySelector('#right-content');

    if (menu) {
      menu.prepend(backButton, forwardButton);
    }
  });
}

export default run;
