import qualitySettingsTemplate from './templates/qualitySettingsTemplate.html?raw';

import builder from './';

import { ElementFromHtml } from '../utils/renderer';
import { YoutubePlayer } from '../../types/youtube-player';

// export default () => {
//   document.addEventListener('apiLoaded', setup, { once: true, passive: true });
// };

export default builder.createRenderer(({ invoke }) => {
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

      invoke<{ response: number }>('qualityChanger', api.getAvailableQualityLabels(), currentIndex)
        .then((promise) => {
          if (promise.response === -1) {
            return;
          }

          const newQuality = qualityLevels[promise.response];
          api.setPlaybackQualityRange(newQuality);
          api.setPlaybackQuality(newQuality);
        });
    });
  }

  return {
    onLoad() {
      document.addEventListener('apiLoaded', setup, { once: true, passive: true });
    }
  };
});
