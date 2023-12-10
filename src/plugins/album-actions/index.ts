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
    loadobserver: null as MutationObserver | null,
    start() {
      this.onPageChange();
      this.observer = new MutationObserver(() => {
        this.onPageChange();
      });
      this.observer.observe(document.querySelector('#browse-page'), {
        attributes: false,
        childList: true,
        subtree: true,
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
        loader = document.getElementById('continuations');
      this.loadobserver = new MutationObserver(() => {
        this.applyToList(id, loader);
      });
      this.applyToList(id, loader);
      this.loadobserver.observe(loader, {
        attributes: true,
        childList: true,
        subtree: true,
      });
      loader?.style.setProperty('top', '0');
      loader?.style.setProperty('left', '50%');
      loader?.style.setProperty('position', 'absolute');
    },
    applyToList(id: string, loader: HTMLElement) {
      if (loader.children.length != 0) return;
      this.loadobserver?.disconnect();
      let playlistbuttons: NodeListOf<Element> | undefined;
      const playlist = document.querySelector('ytmusic-shelf-renderer')
        ? document.querySelector('ytmusic-shelf-renderer')
        : document.querySelector('ytmusic-playlist-shelf-renderer');
      switch (id) {
        case 'allundislike':
          playlistbuttons = playlist?.querySelectorAll(
            '#button-shape-dislike[aria-pressed=true] > button',
          );
          break;
        case 'alldislike':
          playlistbuttons = playlist?.querySelectorAll(
            '#button-shape-dislike[aria-pressed=false] > button',
          );
          break;
        case 'alllike':
          playlistbuttons = playlist?.querySelectorAll(
            '#button-shape-like[aria-pressed=false] > button',
          );
          break;
        case 'allunlike':
          playlistbuttons = playlist?.querySelectorAll(
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
  },
});
