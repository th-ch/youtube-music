const { ipcRenderer } = require('electron');

const { ElementFromFile, templatePath } = require('../utils');

function $(selector) {
  return document.querySelector(selector);
}

const qualitySettingsButton = ElementFromFile(
  templatePath(__dirname, 'qualitySettingsTemplate.html'),
);

module.exports = () => {
  document.addEventListener('apiLoaded', setup, { once: true, passive: true });
};

function setup(event) {
  /**
   * @type {{
   *   getAvailableQualityLevels: () => string[],
   *   getPlaybackQuality: () => string,
   *   getAvailableQualityLabels: () => string[],
   *   setPlaybackQualityRange: (quality: string) => void,
   *   setPlaybackQuality: (quality: string) => void,
   * }}
   */
  const api = event.detail;

  $('.top-row-buttons.ytmusic-player').prepend(qualitySettingsButton);

  qualitySettingsButton.addEventListener('click', function chooseQuality() {
    setTimeout(() => $('#player').click());

    const qualityLevels = api.getAvailableQualityLevels();

    const currentIndex = qualityLevels.indexOf(api.getPlaybackQuality());

    ipcRenderer.invoke('qualityChanger', api.getAvailableQualityLabels(), currentIndex).then((promise) => {
      if (promise.response === -1) {
        return;
      }

      const newQuality = qualityLevels[promise.response];
      api.setPlaybackQualityRange(newQuality);
      api.setPlaybackQuality(newQuality);
    });
  });
}
