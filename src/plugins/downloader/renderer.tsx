import { createSignal } from 'solid-js';

import { customElement, noShadowDOM } from 'solid-element';

import { lazy } from 'lazy-var';

import defaultConfig from '@/config/defaults';
import { getSongMenu } from '@/providers/dom-elements';
import { getSongInfo } from '@/providers/song-info-front';
import { t } from '@/i18n';

import { DownloadButton } from './templates/download';

import type { RendererContext } from '@/types/contexts';
import type { DownloaderPluginConfig } from './index';

let menu: HTMLElement | null = null;
let download: () => void;

const [downloadButtonText, setDownloadButtonText] = createSignal<string>('');

const downloadButtonConstructor = lazy(() =>
  customElement('ytmd-download-button', () => {
    noShadowDOM();

    if (!downloadButtonText()) {
      setDownloadButtonText(t('plugins.downloader.templates.button'));
    }

    return <DownloadButton onClick={download} text={downloadButtonText()} />;
  }),
);

const downloadButton = lazy(async () => {
  return new (await downloadButtonConstructor.get())();
});

let doneFirstLoad = false;

const menuObserver = new MutationObserver(async () => {
  if (!menu) {
    menu = getSongMenu();
    if (!menu) {
      return;
    }
  }

  if (menu.contains(await downloadButton.get())) {
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

  menu.prepend(await downloadButton.get());

  if (!doneFirstLoad) {
    setTimeout(() => (doneFirstLoad ||= true), 500);
  }
});

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
    const targetHtml = feedback || t('plugins.downloader.templates.button');
    setDownloadButtonText(targetHtml);
  });
};

export const onPlayerApiReady = () => {
  menuObserver.observe(document.querySelector('ytmusic-popup-container')!, {
    childList: true,
    subtree: true,
  });
};
