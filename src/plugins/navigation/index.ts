import style from './style.css?inline';
import { createPlugin } from '@/utils';
import { ElementFromHtml } from '@/plugins/utils/renderer';

import { t } from '@/i18n';

import forwardHTML from './templates/forward.html?raw';
import backHTML from './templates/back.html?raw';

export default createPlugin({
  name: () => t('plugins.navigation.name'),
  description: () => t('plugins.navigation.description'),
  restartNeeded: true,
  config: {
    enabled: true,
  },
  stylesheets: [style],
  renderer() {
    const forwardButton = ElementFromHtml(forwardHTML);
    const backButton = ElementFromHtml(backHTML);
    const menu = document.querySelector('#right-content');

    if (menu) {
      menu.prepend(backButton, forwardButton);
    }
  },
});
