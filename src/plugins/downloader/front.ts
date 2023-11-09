import downloadHTML from './templates/download.html?raw';

import defaultConfig from '../../config/defaults';
import { getSongMenu } from '../../providers/dom-elements';
import { ElementFromHtml } from '../utils/renderer';
import { getSongInfo } from '../../providers/song-info-front';

let menu: Element | null = null;
let progress: Element | null = null;
const downloadButton = ElementFromHtml(downloadHTML);

let doneFirstLoad = false;

export default () => {
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

    const menuUrl = document.querySelector<HTMLAnchorElement>('tp-yt-paper-listbox [tabindex="-1"] #navigation-endpoint')?.href;
    if (!menuUrl?.includes('watch?') && doneFirstLoad) {
      return;
    }

    menu.prepend(downloadButton);
    progress = document.querySelector('#ytmcustom-download');

    if (doneFirstLoad) {
      return;
    }

    setTimeout(() => doneFirstLoad ||= true, 500);
  });

  window.download = () => {
    let videoUrl = getSongMenu()
      // Selector of first button which is always "Start Radio"
      ?.querySelector('ytmusic-menu-navigation-item-renderer[tabindex="-1"] #navigation-endpoint')
      ?.getAttribute('href');
    if (videoUrl) {
      if (videoUrl.startsWith('watch?')) {
        videoUrl = defaultConfig.url + '/' + videoUrl;
      }

      if (videoUrl.includes('?playlist=')) {
        window.ipcRenderer.send('download-playlist-request', videoUrl);
        return;
      }
    } else {
      videoUrl = getSongInfo().url || window.location.href;
    }

    window.ipcRenderer.send('download-song', videoUrl);
  };

  document.addEventListener('apiLoaded', () => {
    menuObserver.observe(document.querySelector('ytmusic-popup-container')!, {
      childList: true,
      subtree: true,
    });
  }, { once: true, passive: true });

  window.ipcRenderer.on('downloader-feedback', (_, feedback: string) => {
    if (progress) {
      progress.innerHTML = feedback || 'Download';
    } else {
      console.warn('Cannot update progress');
    }
  });
};
