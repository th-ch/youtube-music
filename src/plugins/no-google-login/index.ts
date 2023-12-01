import style from './style.css?inline';
import { createPlugin } from '@/utils';
import { t } from '@/i18n';

export default createPlugin({
  name: () => t('plugins.no-google-login.name'),
  description: () => t('plugins.no-google-login.description'),
  restartNeeded: true,
  config: {
    enabled: false,
  },
  stylesheets: [style],
  renderer() {
    const elementsToRemove = [
      '.sign-in-link.ytmusic-nav-bar',
      '.ytmusic-pivot-bar-renderer[tab-id="FEmusic_liked"]',
    ];

    for (const selector of elementsToRemove) {
      const node = document.querySelector(selector);
      if (node) {
        node.remove();
      }
    }

    // Remove the library button
    const libraryIconPath =
      'M16,6v2h-2v5c0,1.1-0.9,2-2,2s-2-0.9-2-2s0.9-2,2-2c0.37,0,0.7,0.11,1,0.28V6H16z M18,20H4V6H3v15h15V20z M21,3H6v15h15V3z M7,4h13v13H7V4z';
    const observer = new MutationObserver(() => {
      const menuEntries = document.querySelectorAll(
        '#items ytmusic-guide-entry-renderer',
      );
      menuEntries.forEach((item) => {
        const icon = item.querySelector('path');
        if (icon) {
          observer.disconnect();
          if (icon.getAttribute('d') === libraryIconPath) {
            item.remove();
          }
        }
      });
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  },
});
