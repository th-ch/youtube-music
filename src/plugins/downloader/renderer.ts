import downloadHTML from './templates/download.html?raw';

import defaultConfig from '@/config/defaults';
import { getSongMenu } from '@/providers/dom-elements';
import { getSongInfo } from '@/providers/song-info-front';

import { LoggerPrefix } from '@/utils';

import { ElementFromHtml } from '../utils/renderer';

import type { RendererContext } from '@/types/contexts';

import type { DownloaderPluginConfig } from './index';
import { t } from '@/i18n';

let menu: Element | null = null;
let progress: Element | null = null;
const downloadButton = ElementFromHtml(downloadHTML);

let doneFirstLoad = false;

const menuObserver = new MutationObserver(() => {
  if (!menu) {
    menu = getSongMenu();
    if (!menu) {
      return;
    }
  }

  if (menu.contains(downloadButton)) {
    return;
  }

  const menuUrl = document.querySelector<HTMLAnchorElement>(
    'tp-yt-paper-listbox [tabindex="-1"] #navigation-endpoint',
  )?.href;
  if (!menuUrl?.includes('watch?') && doneFirstLoad) {
    return;
  }

  menu.prepend(downloadButton);
  progress = document.querySelector('#ytmcustom-download');

  if (doneFirstLoad) {
    return;
  }

  setTimeout(() => (doneFirstLoad ||= true), 500);
});

export const onRendererLoad = ({
  ipc,
}: RendererContext<DownloaderPluginConfig>) => {
  window.download = () => {
    let videoUrl = getSongMenu()
      // Selector of first button which is always "Start Radio"
      ?.querySelector(
        'ytmusic-menu-navigation-item-renderer[tabindex="-1"] #navigation-endpoint',
      )
      ?.getAttribute('href');
    if (videoUrl) {
      if (videoUrl.startsWith('watch?')) {
        videoUrl = defaultConfig.url + '/' + videoUrl;
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
    if (progress) {
      progress.innerHTML = feedback || 'Download';
    } else {
      console.warn(
        LoggerPrefix,
        t('plugins.downloader.renderer.can-not-update-progress'),
      );
    }
  });
};

export const onPlayerApiReady = () => {
  menuObserver.observe(document.querySelector('ytmusic-popup-container')!, {
    childList: true,
    subtree: true,
  });
};
