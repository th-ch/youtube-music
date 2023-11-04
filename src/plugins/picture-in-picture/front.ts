import { ipcRenderer } from 'electron';
import { toKeyEvent } from 'keyboardevent-from-electron-accelerator';
import keyEventAreEqual from 'keyboardevents-areequal';

import pipHTML from './templates/picture-in-picture.html';

import { getSongMenu } from '../../providers/dom-elements';

import { ElementFromHtml } from '../utils';

import type { ConfigType } from '../../config/dynamic';

type PiPOptions = ConfigType<'picture-in-picture'>;

function $<E extends Element = Element>(selector: string) {
  return document.querySelector<E>(selector);
}

let useNativePiP = false;
let menu: Element | null = null;
const pipButton = ElementFromHtml(pipHTML);

// Will also clone
function replaceButton(query: string, button: Element) {
  const svg = button.querySelector('#icon svg')?.cloneNode(true);
  if (svg) {
    button.replaceWith(button.cloneNode(true));
    button.remove();
    const newButton = $(query);
    if (newButton) {
      newButton.querySelector('#icon')?.append(svg);
    }
    return newButton;
  }
  return null;
}

function cloneButton(query: string) {
  const button = $(query);
  if (button) {
    replaceButton(query, button);
  }
  return $(query);
}

const observer = new MutationObserver(() => {
  if (!menu) {
    menu = getSongMenu();
    if (!menu) {
      return;
    }
  }

  if (
    menu.contains(pipButton) ||
    !(menu.parentElement as (HTMLElement & { eventSink_: Element }) | null)
    ?.eventSink_
    ?.matches('ytmusic-menu-renderer.ytmusic-player-bar')
  ) {
    return;
  }

  const menuUrl = $<HTMLAnchorElement>('tp-yt-paper-listbox [tabindex="0"] #navigation-endpoint')?.href;
  if (!menuUrl?.includes('watch?')) {
    return;
  }

  menu.prepend(pipButton);
});

const togglePictureInPicture = async () => {
  if (useNativePiP) {
    const isInPiP = document.pictureInPictureElement !== null;
    const video = $<HTMLVideoElement>('video');
    const togglePiP = () =>
      isInPiP
        ? document.exitPictureInPicture.call(document)
        : video?.requestPictureInPicture?.call(video);

    try {
      await togglePiP();
      $<HTMLButtonElement>('#icon')?.click(); // Close the menu
      return true;
    } catch {
    }
  }

  ipcRenderer.send('picture-in-picture');
  return false;
};
// For UI (HTML)
window.togglePictureInPicture = togglePictureInPicture;

const listenForToggle = () => {
  const originalExitButton = $<HTMLButtonElement>('.exit-fullscreen-button');
  const appLayout = $<HTMLElement>('ytmusic-app-layout');
  const expandMenu = $<HTMLElement>('#expanding-menu');
  const middleControls = $<HTMLButtonElement>('.middle-controls');
  const playerPage = $<HTMLElement & { playerPageOpen_: boolean }>('ytmusic-player-page');
  const togglePlayerPageButton = $<HTMLButtonElement>('.toggle-player-page-button');
  const fullScreenButton = $<HTMLButtonElement>('.fullscreen-button');
  const player = $<HTMLVideoElement & { onDoubleClick_: (() => void) | undefined }>('#player');
  const onPlayerDblClick = player?.onDoubleClick_;
  const mouseLeaveEventListener = () => middleControls?.click();

  const titlebar = $<HTMLElement>('.cet-titlebar');

  ipcRenderer.on('pip-toggle', (_, isPip: boolean) => {
    if (originalExitButton && player) {
      if (isPip) {
        replaceButton('.exit-fullscreen-button', originalExitButton)?.addEventListener('click', () => togglePictureInPicture());
        player.onDoubleClick_ = () => {
        };

        expandMenu?.addEventListener('mouseleave', mouseLeaveEventListener);
        if (!playerPage?.playerPageOpen_) {
          togglePlayerPageButton?.click();
        }

        fullScreenButton?.click();
        appLayout?.classList.add('pip');
        if (titlebar) {
          titlebar.style.display = 'none';
        }
      } else {
        $('.exit-fullscreen-button')?.replaceWith(originalExitButton);
        player.onDoubleClick_ = onPlayerDblClick;
        expandMenu?.removeEventListener('mouseleave', mouseLeaveEventListener);
        originalExitButton.click();
        appLayout?.classList.remove('pip');
        if (titlebar) {
          titlebar.style.display = 'flex';
        }
      }
    }
  });
};

function observeMenu(options: PiPOptions) {
  useNativePiP = options.useNativePiP;
  document.addEventListener(
    'apiLoaded',
    () => {
      listenForToggle();

      cloneButton('.player-minimize-button')?.addEventListener('click', async () => {
        await togglePictureInPicture();
        setTimeout(() => $<HTMLButtonElement>('#player')?.click());
      });

      // Allows easily closing the menu by programmatically clicking outside of it
      $('#expanding-menu')?.removeAttribute('no-cancel-on-outside-click');
      // TODO: think about wether an additional button in songMenu is needed
      const popupContainer = $('ytmusic-popup-container');
      if (popupContainer) observer.observe(popupContainer, {
        childList: true,
        subtree: true,
      });
    },
    { once: true, passive: true },
  );
}

export default (options: PiPOptions) => {
  observeMenu(options);

  if (options.hotkey) {
    const hotkeyEvent = toKeyEvent(options.hotkey);
    window.addEventListener('keydown', (event) => {
      if (
        keyEventAreEqual(event, hotkeyEvent)
        && !$<HTMLElement & { opened: boolean }>('ytmusic-search-box')?.opened
      ) {
        togglePictureInPicture();
      }
    });
  }
};
