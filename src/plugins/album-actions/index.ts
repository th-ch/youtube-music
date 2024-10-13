import { t } from '@/i18n';
import { createPlugin } from '@/utils';
import { ElementFromHtml } from '@/plugins/utils/renderer';
import { waitForElement } from '@/utils/wait-for-element';

import undislikeHTML from './templates/undislike.html?raw';
import dislikeHTML from './templates/dislike.html?raw';
import likeHTML from './templates/like.html?raw';
import unlikeHTML from './templates/unlike.html?raw';

export default createPlugin<
  unknown,
  unknown,
  {
    observer?: MutationObserver;
    loadObserver?: MutationObserver;
    changeObserver?: MutationObserver;
    waiting: boolean;
    onPageChange(): void;
    loadFullList: (event: MouseEvent) => void;
    applyToList(id: string, loader: HTMLElement): void;
    start(): void;
    stop(): void;
  }
>({
  name: () => t('plugins.album-actions.name'),
  description: () => t('plugins.album-actions.description'),
  restartNeeded: false,
  addedVersion: '3.2.X',
  config: {
    enabled: false,
  },
  renderer: {
    waiting: false,
    start() {
      // Waits for pagechange
      this.onPageChange();
      this.observer = new MutationObserver(() => {
        this.onPageChange();
      });
      this.observer.observe(document.querySelector('#browse-page')!, {
        attributes: false,
        childList: true,
        subtree: true,
      });
    },
    async onPageChange() {
      if (this.waiting) {
        return;
      } else {
        this.waiting = true;
      }
      const continuations = await waitForElement<HTMLElement>('#continuations');
      this.waiting = false;
      //Gets the for buttons
      const buttons: Array<HTMLElement> = [
        ElementFromHtml(undislikeHTML),
        ElementFromHtml(dislikeHTML),
        ElementFromHtml(likeHTML),
        ElementFromHtml(unlikeHTML),
      ];
      //Finds the playlist
      const playlist =
        document.querySelector('ytmusic-shelf-renderer') ??
        document.querySelector('ytmusic-playlist-shelf-renderer')!;
      // Adds an observer for every button, so it gets updated when one is clicked
      this.changeObserver?.disconnect();
      this.changeObserver = new MutationObserver(() => {
        this.stop();
        this.start();
      });
      const allButtons = playlist.querySelectorAll(
        'yt-button-shape.ytmusic-like-button-renderer',
      );
      for (const btn of allButtons) {
        this.changeObserver.observe(btn, {
          attributes: true,
          childList: false,
          subtree: false,
        });
      }
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
            (
              buttons[i].children[0].children[0] as HTMLElement
            ).style.setProperty(
              '-webkit-mask-size',
              `100% ${100 - (count / listsLength) * 100}%`,
            );
          }
          i++;
        }
      }
      const menuParent =
        document.querySelector('#action-buttons')?.parentElement;
      if (menuParent && !document.querySelector('.like-menu')) {
        const menu = document.createElement('div');
        menu.id = 'ytmd-album-action-buttons';
        menu.className =
          'action-buttons style-scope ytmusic-responsive-header-renderer';

        menuParent.insertBefore(
          menu,
          menuParent.children[menuParent.children.length - 1],
        );
        for (const button of buttons) {
          menu.appendChild(button);
          button.addEventListener('click', this.loadFullList);
        }
      }
    },
    loadFullList(event: MouseEvent) {
      if (event.currentTarget instanceof Element) {
        event.stopPropagation();
        const id = event.currentTarget.id;
        const loader = document.getElementById('continuations')!;
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
      }
    },
    applyToList(id: string, loader: HTMLElement) {
      if (loader.children.length != 0) return;
      this.loadObserver?.disconnect();
      let playlistButtons: NodeListOf<HTMLElement> | undefined;
      const playlist = document.querySelector('ytmusic-shelf-renderer')
        ? document.querySelector('ytmusic-shelf-renderer')
        : document.querySelector('ytmusic-playlist-shelf-renderer');
      switch (id) {
        case 'allundislike':
          playlistButtons = playlist?.querySelectorAll(
            '#button-shape-dislike[aria-pressed=true] > button',
          );
          break;
        case 'alldislike':
          playlistButtons = playlist?.querySelectorAll(
            '#button-shape-dislike[aria-pressed=false] > button',
          );
          break;
        case 'alllike':
          playlistButtons = playlist?.querySelectorAll(
            '#button-shape-like[aria-pressed=false] > button',
          );
          break;
        case 'allunlike':
          playlistButtons = playlist?.querySelectorAll(
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
  },
});
