import { t } from '@/i18n';
import { createPlugin } from '@/utils';
import { ElementFromHtml } from '@/plugins/utils/renderer';

import undislikeHTML from './templates/undislike.html?raw';
import dislikeHTML from './templates/dislike.html?raw';
import likeHTML from './templates/like.html?raw';
import unlikeHTML from './templates/unlike.html?raw';

export default createPlugin({
  name: () => t('plugins.album-actions.name'),
  description: () => t('plugins.album-actions.description'),
  restartNeeded: false,
  renderer: {
    observer: null as MutationObserver | null,
    start() {
      this.onPageChange();
      this.waitForElem('#browse-page').then((page: HTMLElement) => {
        this.observer = new MutationObserver(() => {
          this.onPageChange();
        });
        this.observer.observe(page, {
          attributes: false,
          childList: true,
          subtree: true,
        });
      });
    },
    onPageChange() {
      const buttons: Array<HTMLElement> = [
        ElementFromHtml(undislikeHTML),
        ElementFromHtml(dislikeHTML),
        ElementFromHtml(likeHTML),
        ElementFromHtml(unlikeHTML),
      ];
      const menu = document.querySelector('.detail-page-menu');
      if (menu && !document.querySelector('.like-menu')) {
        for (const button of buttons) {
          menu.appendChild(button);
          button.addEventListener('click', this.loadFullList);
        }
      }
    },
    loadFullList(event) {
      event.stopPropagation();
      const id: string = event.currentTarget.id,
        loader: HTMLElement = document.getElementById('continuations'),
        loadobserver = new MutationObserver(() => {
          if (loader.children.length == 0) {
            this.applyToList(id);
            loadobserver.disconnect();
          }
        });
      loadobserver.observe(loader, {
        attributes: true,
        childList: true,
        subtree: true,
      });
      loader.style.top = '50%';
      loader.style.left = '50%';
      loader.style.position = 'absolute';
    },
    applyToList(id: string) {
      let playlistbuttons: NodeListOf<Element> | undefined;
      switch (id) {
        case 'allundislike':
          playlistbuttons = document
            .querySelector('ytmusic-shelf-renderer')
            ?.querySelectorAll(
              '#button-shape-dislike[aria-pressed=true] > button',
            );
          break;
        case 'alldislike':
          playlistbuttons = document
            .querySelector('ytmusic-shelf-renderer')
            ?.querySelectorAll(
              '#button-shape-dislike[aria-pressed=false] > button',
            );
          break;
        case 'alllike':
          playlistbuttons = document
            .querySelector('ytmusic-shelf-renderer')
            ?.querySelectorAll(
              '#button-shape-like[aria-pressed=false] > button',
            );
          break;
        case 'allunlike':
          playlistbuttons = document
            .querySelector('ytmusic-shelf-renderer')
            ?.querySelectorAll(
              '#button-shape-like[aria-pressed=true] > button',
            );
          break;
        default:
      }
      if (playlistbuttons)
        for (const elem of playlistbuttons) {
          elem.click();
        }
    },
    stop() {
      this.observer?.disconnect();
      for (const button of document.querySelectorAll('.like-menu')) {
        button.remove();
      }
    },
    waitForElem(selector: string): Promise<Element> {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          const elem = document.querySelector(selector);
          if (!elem) return;

          clearInterval(interval);
          resolve(elem);
        });
      });
    },
  },
});
