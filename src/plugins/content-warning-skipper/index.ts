import { createPlugin } from '@/utils';
import { t } from '@/i18n';

export default createPlugin({
  name: () => t('plugins.content-warning-skipper.name'),
  description: () => t('plugins.content-warning-skipper.description'),
  restartNeeded: false,
  renderer: () => {
    const observer = new MutationObserver(() => {
      const button = document.querySelector<HTMLElement>(
        '#button yt-button-renderer button',
      );
      if (!button) return;

      const isVisible = button.offsetParent !== null;
      const isEnabled = button.getAttribute('aria-disabled') === 'false';

      if (isVisible && isEnabled) {
        button.click();
        console.log('Content warning button triggered');
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  },
});
