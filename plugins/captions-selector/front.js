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
        const captionTrackList = api.getOption("captions", "tracklist");

        if (captionTrackList?.length) {
            api.pauseVideo();

            const currentCaptionTrack = api.getOption("captions", "track");
            const currentIndex = captionTrackList.indexOf(captionTrackList.find(track => track.languageCode === currentCaptionTrack.languageCode));

            const captionLabels = [
                ...captionTrackList.map(track => track.displayName), 
                'None'
            ];

            ipcRenderer.invoke('captionsSelector', captionLabels, currentIndex).then(promise => {
                if (promise.response === -1) return;

                const newCaptions = captionTrackList[promise.response];
                if (newCaptions) {
                    api.loadModule("captions");
                    api.setOption("captions", "track", { languageCode: newCaptions.languageCode });
                } else {
                    api.unloadModule("captions");
                }

                setTimeout(() => api.playVideo());
            });
        }
    }
}
