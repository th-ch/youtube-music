import { ipcRenderer } from 'electron';
import { toKeyEvent } from 'keyboardevent-from-electron-accelerator';
import keyEventAreEqual from 'keyboardevents-areequal';

import { getSongMenu } from '../../providers/dom-elements';

import { ElementFromFile, templatePath } from '../utils';

import type { ConfigType } from '../../config/dynamic';

type PiPOptions = ConfigType<'picture-in-picture'>;

function $(selector: string) {
  return document.querySelector(selector);
}

let useNativePiP = false;
let menu: Element | null = null;
const pipButton = ElementFromFile(
  templatePath(__dirname, 'picture-in-picture.html'),
);

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

  const menuUrl = ($(
    'tp-yt-paper-listbox [tabindex="0"] #navigation-endpoint',
  ) as HTMLAnchorElement)?.href;
  if (menuUrl && !menuUrl.includes('watch?')) {
    return;
  }

  menu.prepend(pipButton);
});

const togglePictureInPicture = async () => {
  if (useNativePiP) {
    const isInPiP = document.pictureInPictureElement !== null;
    const video = $('video') as HTMLVideoElement | null;
    const togglePiP = () =>
      isInPiP
        ? document.exitPictureInPicture.call(document)
        : video?.requestPictureInPicture?.call(video);

    try {
      await togglePiP();
      ($('#icon') as HTMLButtonElement | null)?.click(); // Close the menu
      return true;
    } catch {
    }
  }

  ipcRenderer.send('picture-in-picture');
  return false;
};
// For UI (HTML)
// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
(global as any).togglePictureInPicture = togglePictureInPicture;

const listenForToggle = () => {
  const originalExitButton = $('.exit-fullscreen-button') as HTMLButtonElement;
  const appLayout = $('ytmusic-app-layout') as HTMLElement;
  const expandMenu = $('#expanding-menu') as HTMLElement;
  const middleControls = $('.middle-controls') as HTMLButtonElement;
  const playerPage = $('ytmusic-player-page') as HTMLElement & { playerPageOpen_: boolean };
  const togglePlayerPageButton = $('.toggle-player-page-button') as HTMLButtonElement;
  const fullScreenButton = $('.fullscreen-button') as HTMLButtonElement;
  const player = ($('#player') as (HTMLVideoElement & { onDoubleClick_: () => void | undefined }));
  const onPlayerDblClick = player?.onDoubleClick_;

  const titlebar = $('.cet-titlebar') as HTMLElement;

  ipcRenderer.on('pip-toggle', (_, isPip: boolean) => {
    if (isPip) {
      replaceButton('.exit-fullscreen-button', originalExitButton)?.addEventListener('click', () => togglePictureInPicture());
      player.onDoubleClick_ = () => {
      };

      expandMenu.addEventListener('mouseleave', () => middleControls.click());
      if (!playerPage.playerPageOpen_) {
        togglePlayerPageButton.click();
      }

      fullScreenButton.click();
      appLayout.classList.add('pip');
      if (titlebar) {
        titlebar.style.display = 'none';
      }
    } else {
      $('.exit-fullscreen-button')?.replaceWith(originalExitButton);
      player.onDoubleClick_ = onPlayerDblClick;
      expandMenu.onmouseleave = null;
      originalExitButton.click();
      appLayout.classList.remove('pip');
      if (titlebar) {
        titlebar.style.display = 'flex';
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
        setTimeout(() => ($('#player') as HTMLButtonElement | undefined)?.click());
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
        && !($('ytmusic-search-box') as (HTMLElement & { opened: boolean }) | undefined)?.opened
      ) {
        togglePictureInPicture();
      }
    });
  }
};
