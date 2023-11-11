import qualitySettingsTemplate from './templates/qualitySettingsTemplate.html?raw';

import builder from './index';

import { ElementFromHtml } from '../utils/renderer';

import type { YoutubePlayer } from '../../types/youtube-player';

export default builder.createRenderer(({ invoke }) => {
  function $(selector: string): HTMLElement | null {
    return document.querySelector(selector);
  }

  const qualitySettingsButton = ElementFromHtml(qualitySettingsTemplate);

  let api: YoutubePlayer;

  const chooseQuality = () => {
    setTimeout(() => $('#player')?.click());

    const qualityLevels = api.getAvailableQualityLevels();

    const currentIndex = qualityLevels.indexOf(api.getPlaybackQuality());

    invoke<{ response: number }>('qualityChanger', api.getAvailableQualityLabels(), currentIndex)
      .then((promise) => {
        if (promise.response === -1) {
          return;
        }

        const newQuality = qualityLevels[promise.response];
        api.setPlaybackQualityRange(newQuality);
        api.setPlaybackQuality(newQuality);
      });
  }

  function setup(event: CustomEvent<YoutubePlayer>) {
    api = event.detail;

    $('.top-row-buttons.ytmusic-player')?.prepend(qualitySettingsButton);

    qualitySettingsButton.addEventListener('click', chooseQuality);
  }

  return {
    onLoad() {
      document.addEventListener('apiLoaded', setup, { once: true, passive: true });
    },
    onUnload() {
      $('.top-row-buttons.ytmusic-player')?.removeChild(qualitySettingsButton);
      qualitySettingsButton.removeEventListener('click', chooseQuality);
    }
  };
});
