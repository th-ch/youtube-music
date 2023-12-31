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
  addedVersion: '3.2.0',
  config: {
    enabled: false,
  },
  renderer: {
    observer: null as MutationObserver | null,
    loadObserver: null as MutationObserver | null,
    changeObserver: null as MutationObserver | null,
    waiting: false as boolean,
    start() {
      //Waits for pagechange
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
      if (this.waiting) {
        return;
      } else {
        this.waiting = true;
      }
      this.waitForElem('#continuations').then((continuations: HTMLElement) => {
        this.waiting = false;
        //Gets the for buttons
        let buttons: Array<HTMLElement> = [
          ElementFromHtml(undislikeHTML),
          ElementFromHtml(dislikeHTML),
          ElementFromHtml(likeHTML),
          ElementFromHtml(unlikeHTML),
        ];
        //Finds the playlist
        const playlist =
          document.querySelector('ytmusic-shelf-renderer') ??
          document.querySelector('ytmusic-playlist-shelf-renderer');
        //Adds an observer for every button so it gets updated when one is clicked
        this.changeObserver?.disconnect();
        this.changeObserver = new MutationObserver(() => {
          this.stop();
          this.start();
        });
        const allButtons = playlist.querySelectorAll(
          'yt-button-shape.ytmusic-like-button-renderer',
        );
        for (const btn of allButtons)
          this.changeObserver.observe(btn, {
            attributes: true,
            childList: false,
            subtree: false,
          });
        //Determine if button is needed and colors the percentage
        const listsLength = playlist.querySelectorAll(
          '#button-shape-dislike > button',
        ).length;
        if (continuations.children.length == 0 && listsLength > 0) {
          const counts = [
            playlist?.querySelectorAll(
              '#button-shape-dislike[aria-pressed=true] > button',
            ).length,
            playlist?.querySelectorAll(
              '#button-shape-dislike[aria-pressed=false] > button',
            ).length,
            playlist?.querySelectorAll(
              '#button-shape-like[aria-pressed=false] > button',
            ).length,
            playlist?.querySelectorAll(
              '#button-shape-like[aria-pressed=true] > button',
            ).length,
          ];
          let i = 0;
          for (const count of counts) {
            if (count == 0) {
              buttons.splice(i, 1);
              i--;
            } else {
              buttons[i].children[0].children[0].style.setProperty(
                '-webkit-mask-size',
                `100% ${100 - (count / listsLength) * 100}%`,
              );
            }
            i++;
          }
        }
        const menu = document.querySelector('.detail-page-menu');
        if (menu && !document.querySelector('.like-menu')) {
          for (const button of buttons) {
            menu.appendChild(button);
            button.addEventListener('click', this.loadFullList);
          }
        }
      });
    },
    loadFullList(event) {
      event.stopPropagation();
      const id: string = event.currentTarget.id,
        loader = document.getElementById('continuations');
      this.loadObserver = new MutationObserver(() => {
        this.applyToList(id, loader);
      });
      this.applyToList(id, loader);
      this.loadObserver.observe(loader, {
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
      this.loadObserver?.disconnect();
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
      playlistButtons?.forEach((elem) => elem.click());
    },
    stop() {
      this.observer?.disconnect();
      this.changeObserver?.disconnect();
      for (const button of document.querySelectorAll('.like-menu')) {
        button.remove();
      }
    },
    waitForElem(selector: string) {
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
