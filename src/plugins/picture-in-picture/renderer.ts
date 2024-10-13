import { toKeyEvent } from 'keyboardevent-from-electron-accelerator';
import keyEventAreEqual from 'keyboardevents-areequal';

import pipHTML from './templates/picture-in-picture.html?raw';

import { getSongMenu } from '@/providers/dom-elements';

import { ElementFromHtml } from '../utils/renderer';

import type { PictureInPicturePluginConfig } from './index';
import type { RendererContext } from '@/types/contexts';

function $<E extends Element = Element>(selector: string) {
  return document.querySelector<E>(selector);
}

let useNativePiP = false;
let menu: Element | null = null;
const pipButton = ElementFromHtml(pipHTML);

let doneFirstLoad = false;

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
    !(
      menu.parentElement as (HTMLElement & { eventSink_: Element }) | null
    )?.eventSink_?.matches('ytmusic-menu-renderer.ytmusic-player-bar')
  ) {
    return;
  }

  // check for video (or music)
  let menuUrl = $<HTMLAnchorElement>(
    'tp-yt-paper-listbox [tabindex="0"] #navigation-endpoint',
  )?.href;

  if (!menuUrl?.includes('watch?')) {
    menuUrl = undefined;
    // check for podcast
    for (const it of document.querySelectorAll(
      'tp-yt-paper-listbox [tabindex="-1"] #navigation-endpoint',
    )) {
      if (it.getAttribute('href')?.includes('podcast/')) {
        menuUrl = it.getAttribute('href')!;
        break;
      }
    }
  }

  if (!menuUrl && doneFirstLoad) {
    return;
  }

  menu.prepend(pipButton);

  if (!doneFirstLoad) {
    setTimeout(() => (doneFirstLoad ||= true), 500);
  }
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
    } catch {}
  }

  window.ipcRenderer.send('plugin:toggle-picture-in-picture');
  return false;
};
// For UI (HTML)
window.togglePictureInPicture = togglePictureInPicture;

const listenForToggle = () => {
  const originalExitButton = $<HTMLButtonElement>('.exit-fullscreen-button');
  const appLayout = $<HTMLElement>('ytmusic-app-layout');
  const expandMenu = $<HTMLElement>('#expanding-menu');
  const middleControls = $<HTMLButtonElement>('.middle-controls');
  const playerPage = $<HTMLElement & { playerPageOpen_: boolean }>(
    'ytmusic-player-page',
  );
  const togglePlayerPageButton = $<HTMLButtonElement>(
    '.toggle-player-page-button',
  );
  const fullScreenButton = $<HTMLButtonElement>('.fullscreen-button');
  const player = $<
    HTMLVideoElement & { onDoubleClick_: (() => void) | undefined }
  >('#player');
  const onPlayerDblClick = player?.onDoubleClick_;
  const mouseLeaveEventListener = () => middleControls?.click();

  const titlebar = $<HTMLElement>('.cet-titlebar');

  window.ipcRenderer.on('pip-toggle', (_, isPip: boolean) => {
    if (originalExitButton && player) {
      if (isPip) {
        replaceButton(
          '.exit-fullscreen-button',
          originalExitButton,
        )?.addEventListener('click', () => togglePictureInPicture());
        player.onDoubleClick_ = () => {};

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

export const onRendererLoad = async ({
  getConfig,
}: RendererContext<PictureInPicturePluginConfig>) => {
  const config = await getConfig();

  useNativePiP = config.useNativePiP;

  if (config.hotkey) {
    const hotkeyEvent = toKeyEvent(config.hotkey);
    window.addEventListener('keydown', (event) => {
      if (
        keyEventAreEqual(event, hotkeyEvent) &&
        !$<HTMLElement & { opened: boolean }>('ytmusic-search-box')?.opened
      ) {
        togglePictureInPicture();
      }
    });
  }
};

export const onPlayerApiReady = () => {
  listenForToggle();

  cloneButton('.player-minimize-button')?.addEventListener(
    'click',
    async () => {
      await togglePictureInPicture();
      setTimeout(() => $<HTMLButtonElement>('#player')?.click());
    },
  );

  // Allows easily closing the menu by programmatically clicking outside of it
  $('#expanding-menu')?.removeAttribute('no-cancel-on-outside-click');
  // TODO: think about wether an additional button in songMenu is needed
  const popupContainer = $('ytmusic-popup-container');
  if (popupContainer)
    observer.observe(popupContainer, {
      childList: true,
      subtree: true,
    });
};
