import qualitySettingsTemplate from './templates/qualitySettingsTemplate.html?raw';

import { ElementFromHtml } from '../utils-renderer';
import { YoutubePlayer } from '../../types/youtube-player';

function $(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

const qualitySettingsButton = ElementFromHtml(qualitySettingsTemplate);

function setup(event: CustomEvent<YoutubePlayer>) {
  const api = event.detail;

  $('.top-row-buttons.ytmusic-player')?.prepend(qualitySettingsButton);

  qualitySettingsButton.addEventListener('click', function chooseQuality() {
    setTimeout(() => $('#player')?.click());

    const qualityLevels = api.getAvailableQualityLevels();

    const currentIndex = qualityLevels.indexOf(api.getPlaybackQuality());

    window.ipcRenderer.invoke('qualityChanger', api.getAvailableQualityLabels(), currentIndex).then((promise: { response: number }) => {
      if (promise.response === -1) {
        return;
      }

      const newQuality = qualityLevels[promise.response];
      api.setPlaybackQualityRange(newQuality);
      api.setPlaybackQuality(newQuality);
    });
  });
}

export default () => {
  document.addEventListener('apiLoaded', setup, { once: true, passive: true });
};
