import { t } from '@/i18n';
import { createPlugin } from '@/utils';

export default createPlugin({
    name: () => t('plugins.skip-disliked-songs.name'),
    description: () => t('plugins.skip-disliked-songs.description'),
    restartNeeded: false,
    renderer: {
        observer: MutationObserver,
        async start() {
            const likeBtn = await this.waitForElem('#like-button-renderer');
            this.observer = new MutationObserver(() => {
                if (likeBtn?.getAttribute("like-status") == "DISLIKE")
                    document.querySelector("tp-yt-paper-icon-button.next-button")?.click();
            });
            this.observer.observe(likeBtn,
                { attributes: true, childList: false, subtree: false });
        },
        stop() {
            this.observer.disconnect();
        },
        waitForElem(selector) {
            return new Promise(resolve => {
                const interval = setInterval(() => {
                    const elem = document.querySelector(selector);
                    if (!elem) return;
        
                    clearInterval(interval);
                    resolve(elem);
                });
            });
        }
    }
});