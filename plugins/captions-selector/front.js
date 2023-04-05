const { ElementFromFile, templatePath } = require("../utils");
const { ipcRenderer } = require("electron");

const configProvider = require("./config");
let config;

function $(selector) { return document.querySelector(selector); }

const captionsSettingsButton = ElementFromFile(
    templatePath(__dirname, "captions-settings-template.html")
);

module.exports = async () => {
	config = await configProvider.getAll();

	configProvider.subscribeAll((newConfig) => {
		config = newConfig;
	});
    document.addEventListener('apiLoaded', (event) => setup(event.detail), { once: true, passive: true });
}

function setup(api) {
    $(".right-controls-buttons").append(captionsSettingsButton);

    let captionTrackList = api.getOption("captions", "tracklist");

	$("video").addEventListener("srcChanged", async () => {
		if (config.disableCaptions) {
			setTimeout(() => api.unloadModule("captions"), 100);
			captionsSettingsButton.style.display = "none";
			return;
		}

		api.loadModule("captions");

		setTimeout(async () => {
			captionTrackList = api.getOption("captions", "tracklist");

			if (config.autoload && config.lastCaptionsCode) {
				api.setOption("captions", "track", {
					languageCode: config.lastCaptionsCode,
				});
			}

			captionsSettingsButton.style.display = captionTrackList?.length
				? "inline-block"
				: "none";
		}, 250);
	});

    captionsSettingsButton.onclick = async () => {
        if (captionTrackList?.length) {
            const currentCaptionTrack = api.getOption("captions", "track");
            let currentIndex = !currentCaptionTrack ?
				null :
				captionTrackList.indexOf(captionTrackList.find(track => track.languageCode === currentCaptionTrack.languageCode));

            const captionLabels = [
                ...captionTrackList.map(track => track.displayName),
                'None'
            ];

            currentIndex = await ipcRenderer.invoke('captionsSelector', captionLabels, currentIndex)
			if (currentIndex === null) return;

			const newCaptions = captionTrackList[currentIndex];
            configProvider.set('lastCaptionsCode', newCaptions?.languageCode);
			if (newCaptions) {
				api.setOption("captions", "track", { languageCode: newCaptions.languageCode });
			} else {
				api.setOption("captions", "track", {});
			}

			setTimeout(() => api.playVideo());
        }
    }
}
