import forwardHTML from './templates/forward.html?raw';
import backHTML from './templates/back.html?raw';

import builder from './index';

import { ElementFromHtml } from '../utils/renderer';

export default builder.createRenderer(() => {
  return {
    onLoad() {
      const forwardButton = ElementFromHtml(forwardHTML);
      const backButton = ElementFromHtml(backHTML);
      const menu = document.querySelector('#right-content');

      if (menu) {
        menu.prepend(backButton, forwardButton);
      }
    }
  };
});
