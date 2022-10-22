const { ElementFromFile, templatePath } = require("../utils");
const { ipcRenderer } = require("electron");

const captionsSettingsButton = ElementFromFile(
    templatePath(__dirname, "captionsSettingsTemplate.html")
);

module.exports = () => {
    document.addEventListener('apiLoaded', setup, { once: true, passive: true });
}

function setup(event) {
    const api = event.detail;

    document.querySelector('.right-controls-buttons').append(captionsSettingsButton);

    captionsSettingsButton.onclick = function chooseQuality() {
        api.pauseVideo();

        const currentCaptionTrack = api.getOption("captions", "track");
        const captionTrackList = api.getOption("captions", "tracklist");

        const currentIndex = captionTrackList.indexOf(captionTrackList.find(track => track.languageCode === currentCaptionTrack.languageCode));

        ipcRenderer.invoke('captionsSelector', captionTrackList.map(track => track.displayName), currentIndex).then(promise => {
            if (promise.response === -1) return;
            const newCaptions = captionTrackList[promise.response];
            api.setOption("captions", "track", { languageCode: newCaptions.languageCode });
        });
    }
}
