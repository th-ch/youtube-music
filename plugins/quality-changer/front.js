const { ElementFromFile, templatePath } = require("../utils");
const { ipcRenderer } = require("electron");

function $(selector) { return document.querySelector(selector); }

const qualitySettingsButton = ElementFromFile(
    templatePath(__dirname, "qualitySettingsTemplate.html")
);


module.exports = () => {
    document.addEventListener('apiLoaded', setup, { once: true, passive: true });
}

function setup(event) {
    const api = event.detail;

    $('.top-row-buttons.ytmusic-player').prepend(qualitySettingsButton);

    qualitySettingsButton.onclick = function chooseQuality() {
        if (api.getPlayerState() === 2) api.playVideo();
        else if (api.getPlayerState() === 1) api.pauseVideo();

        const qualityLevels = api.getAvailableQualityLevels();

        const currentIndex = qualityLevels.indexOf(api.getPlaybackQuality());

        ipcRenderer.invoke('qualityChanger', api.getAvailableQualityLabels(), currentIndex).then(promise => {
            if (promise.response === -1) return;
            const newQuality = qualityLevels[promise.response];
            api.setPlaybackQualityRange(newQuality);
            api.setPlaybackQuality(newQuality)
        });
    }
}
