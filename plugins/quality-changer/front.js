const { ElementFromFile, templatePath } = require("../utils");
const dialog = require('electron').remote.dialog

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

        const currentIndex = api.getAvailableQualityLevels().indexOf(api.getPlaybackQuality())

        dialog.showMessageBox({
            type: "question",
            buttons: api.getAvailableQualityLabels(),
            defaultId: currentIndex,
            title: "Choose Video Quality",
            message: "Choose Video Quality:",
            detail: `Current Quality: ${api.getAvailableQualityLabels()[currentIndex]}`,
            cancelId: -1
        }).then((promise) => {
            if (promise.response === -1) return;
            const newQuality = api.getAvailableQualityLevels()[promise.response];
            api.setPlaybackQualityRange(newQuality);
            api.setPlaybackQuality(newQuality)
        })
    }
}
