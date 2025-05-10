import { createPlugin } from '@/utils';
import { t } from '@/i18n';

import { waitForElement } from '@/utils/wait-for-element';

export default createPlugin({
  name: () => t('plugins.content-warning-skipper.name'),
  description: () => t('plugins.content-warning-skipper.description'),
  restartNeeded: false,
  renderer: () => {
    waitForElement<HTMLElement>('#button yt-button-renderer button').then(
      (button) => {
        if (!button) return;

        const isVisible = button.offsetParent !== null;
        const isEnabled = button.getAttribute('aria-disabled') === 'false';

        if (isVisible && isEnabled) {
          button.click();
        }
      },
    );
  },
});
