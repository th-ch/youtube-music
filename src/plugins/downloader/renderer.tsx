import {
  createRoot,
  createSignal,
  getOwner,
  onCleanup,
  onMount,
  Owner,
  runWithOwner,
} from 'solid-js';

import defaultConfig from '@/config/defaults';
import { getSongMenu } from '@/providers/dom-elements';
import { getSongInfo } from '@/providers/song-info-front';
import { t } from '@/i18n';

import { DownloadButton } from './templates/download';

import type { RendererContext } from '@/types/contexts';
import type { DownloaderPluginConfig } from './index';

let menu: Element | null = null;
let owner: Owner | null = null;
let download: () => void;

const [downloadButtonText, setDownloadButtonText] = createSignal<string>();

const createDownloadButtonWithObserver = (onClickHandler: () => void) => {
  return createRoot((dispose) => {
    if (!downloadButtonText()) {
      setDownloadButtonText(t('plugins.downloader.templates.button'));
    }

    // Store the owner here for later updates outside of this root's reactive context
    owner = getOwner();

    const button = DownloadButton({
      onClick: onClickHandler,
      getText: downloadButtonText,
    }) as HTMLElement;

    let doneFirstLoad = false;

    const menuObserver = new MutationObserver(() => {
      if (!menu) {
        menu = getSongMenu();
        if (!menu) {
          return;
        }
      }

      if (menu.contains(button)) {
        return;
      }

      let menuUrl = document.querySelector<HTMLAnchorElement>(
        'tp-yt-paper-listbox [tabindex="0"] #navigation-endpoint',
      )?.href;
      if (!menuUrl?.includes('watch?')) {
        menuUrl = undefined;
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

      menu.prepend(button);

      if (!doneFirstLoad) {
        setTimeout(() => (doneFirstLoad ||= true), 500);
      }
    });

    onMount(() => {
      menuObserver.observe(document.querySelector('ytmusic-popup-container')!, {
        childList: true,
        subtree: true,
      });
    });

    onCleanup(() => {
      menuObserver.disconnect();
      button.remove();
      dispose(); // This disposes the createRoot context
    });

    return button;
  });
};

export const onRendererLoad = ({
  ipc,
}: RendererContext<DownloaderPluginConfig>) => {
  download = () => {
    const songMenu = getSongMenu();
    let videoUrl = songMenu
      ?.querySelector(
        'ytmusic-menu-navigation-item-renderer[tabindex="0"] #navigation-endpoint',
      )
      ?.getAttribute('href');

    if (!videoUrl && songMenu) {
      for (const it of songMenu.querySelectorAll(
        'ytmusic-menu-navigation-item-renderer[tabindex="-1"] #navigation-endpoint',
      )) {
        if (it.getAttribute('href')?.includes('podcast/')) {
          videoUrl = it.getAttribute('href');
          break;
        }
      }
    }

    if (videoUrl) {
      if (videoUrl.startsWith('watch?')) {
        videoUrl = defaultConfig.url + '/' + videoUrl;
      }

      if (videoUrl.startsWith('podcast/')) {
        videoUrl =
          defaultConfig.url + '/watch?' + videoUrl.replace('podcast/', 'v=');
      }

      if (videoUrl.includes('?playlist=')) {
        ipc.invoke('download-playlist-request', videoUrl);
        return;
      }
    } else {
      videoUrl = getSongInfo().url || window.location.href;
    }

    ipc.invoke('download-song', videoUrl);
  };

  ipc.on('downloader-feedback', (feedback: string) => {
    console.log('Received feedback from downloader:', feedback);
    const targetHtml = feedback || t('plugins.downloader.templates.button');

    // Run the signal update within the correct owner context
    // This is correct as long as 'owner' is correctly set
    if (owner) {
      runWithOwner(owner, () => setDownloadButtonText(targetHtml));
      console.log('Signal updated via runWithOwner to:', downloadButtonText());
    } else {
      console.warn('Owner not found for updating downloadButtonText signal.');
    }
  });
};

export const onPlayerApiReady = () => {
  createDownloadButtonWithObserver(download);
};
