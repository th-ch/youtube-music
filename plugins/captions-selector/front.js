const { ElementFromFile, templatePath } = require("../utils");
const { ipcRenderer } = require("electron");

const config = require("./config");

function $(selector) { return document.querySelector(selector); }

const captionsSettingsButton = ElementFromFile(
    templatePath(__dirname, "captions-settings-template.html")
);

module.exports = () => {
    document.addEventListener('apiLoaded', (event) => setup(event.detail), { once: true, passive: true });
}

function setup(api) {
    $(".right-controls-buttons").append(captionsSettingsButton);

    let captionTrackList = api.getOption("captions", "tracklist");

	$("video").addEventListener("srcChanged", async () => {
		if (await config.get('disableCaptions')) {
			setTimeout(() => api.unloadModule("captions"), 100);
			captionsSettingsButton.style.display = "none";
			return;
		}

		api.loadModule("captions");

		setTimeout(async () => {
			captionTrackList = api.getOption("captions", "tracklist");

			if (await config.get("autoload") && await config.get("lastCaptionsCode")) {
				api.setOption("captions", "track", {
					languageCode: await config.get("lastCaptionsCode"),
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
            config.set('lastCaptionsCode', newCaptions?.languageCode);
			if (newCaptions) {
				api.setOption("captions", "track", { languageCode: newCaptions.languageCode });
			} else {
				api.setOption("captions", "track", {});
			}

			setTimeout(() => api.playVideo());
        }
    }
}
