import { t } from '@/i18n';
import { createPlugin } from '@/utils';

export default createPlugin<
  unknown,
  unknown,
  {
    observer?: MutationObserver;
    waitForElem(selector: string): Promise<HTMLElement>;
    start(): void;
    stop(): void;
  }
>({
  name: () => t('plugins.skip-disliked-songs.name'),
  description: () => t('plugins.skip-disliked-songs.description'),
  restartNeeded: false,
  renderer: {
    waitForElem(selector: string) {
      return new Promise<HTMLElement>((resolve) => {
        const interval = setInterval(() => {
          const elem = document.querySelector<HTMLElement>(selector);
          if (!elem) return;

          clearInterval(interval);
          resolve(elem);
        });
      });
    },
    start() {
      this.waitForElem('#dislike-button-renderer').then((dislikeBtn) => {
        this.observer = new MutationObserver(() => {
          if (dislikeBtn?.getAttribute('like-status') == 'DISLIKE') {
            document
              .querySelector<HTMLButtonElement>('tp-yt-paper-icon-button.next-button')
              ?.click();
          }
        });
        this.observer.observe(dislikeBtn, {
          attributes: true,
          childList: false,
          subtree: false,
        });
      });
    },
    stop() {
      this.observer?.disconnect();
    },
  },
});
