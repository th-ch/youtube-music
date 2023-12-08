import { t } from '@/i18n';
import { createPlugin } from '@/utils';

export default createPlugin({
    name: () => t('plugins.skip-disliked-songs.name'),
    description: () => t('plugins.skip-disliked-songs.description'),
    restartNeeded: true,
    config: {
      enabled: true,
    },
    renderer() {
        new MutationObserver(() => {
            if (document.querySelector("#like-button-renderer")?.getAttribute("like-status") == "DISLIKE") document.querySelector("tp-yt-paper-icon-button.next-button")?.click();
        }).observe(document.querySelector("#like-button-renderer"), { attributes: true, childList: false, subtree: false });
    },
  });  