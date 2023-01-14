const { ElementFromFile, templatePath } = require("../utils");
const { ipcRenderer } = require("electron");

function $(selector) { return document.querySelector(selector); }

const captionsSettingsButton = ElementFromFile(
    templatePath(__dirname, "captions-settings-template.html")
);

module.exports = (options) => {
    document.addEventListener('apiLoaded', (event) => setup(event, options), { once: true, passive: true });
}

/**
 * If captions are disabled by default,
 * unload "captions" module when video changes.
 */
const videoChanged = (api, options) => {
    if (options.disableCaptions) {
        setTimeout(() => api.unloadModule("captions"), 100);
    }
}

function setup(event, options) {
    const api = event.detail;

    $("video").addEventListener("srcChanged", () => videoChanged(api, options));

    $(".right-controls-buttons").append(captionsSettingsButton);

    captionsSettingsButton.onclick = function chooseQuality() {
        api.loadModule("captions");

        const captionTrackList = api.getOption("captions", "tracklist");

        if (captionTrackList?.length) {
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
