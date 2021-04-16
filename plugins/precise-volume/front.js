const { setOptions } = require("../../config/plugins");

module.exports = (options) => {
	setPlaybarOnwheel(options);
	setObserver(options);
	firstRun(options);
};

function saveVolume(volume, options) {
	options.savedVolume = volume;
	setOptions("precise-volume", options);
}

function firstRun(options) {
	const videoStream = document.querySelector(".video-stream");
	const slider = document.querySelector("#volume-slider");

	if (videoStream && slider) {
		// Set saved volume if it pass checks
		if (options.savedVolume
			&& options.savedVolume >= 0 && options.savedVolume <= 100
			&& Math.abs(slider.value - options.savedVolume) < 5
			// If plugin was disabled and volume changed then diff>4
		) {
			videoStream.volume = options.savedVolume / 100;
			slider.value = options.savedVolume;
		}

		// Set current volume as tooltip
		setTooltip(toPercent(videoStream.volume));
	} else {
		setTimeout(firstRun, 500, options); // Try again in 500 milliseconds
	}
}

function setPlaybarOnwheel(options) {
	// Add onwheel event to play bar
	document.querySelector("ytmusic-player-bar").onwheel = event => {
		event.preventDefault();
		// Event.deltaY < 0 => wheel up
		changeVolume(event.deltaY < 0, options);
	};
}

function changeVolume(increase, options) {
	// Need to change both the slider and the actual volume
	const videoStream = document.querySelector(".video-stream");
	const slider = document.querySelector("#volume-slider");

	// Apply volume change if valid
	videoStream.volume = increase ?
		Math.min(videoStream.volume + 0.01, 1) :
		Math.max(videoStream.volume - 0.01, 0);

	// Save the new volume
	saveVolume(toPercent(videoStream.volume), options);
	// Slider value automatically rounds to multiples of 5
	slider.value = options.savedVolume;
	// Finally change tooltip to new value
	setTooltip(options.savedVolume);
}

// Save volume + Update the volume tooltip when volume-slider is manually changed
function setObserver(options) {
	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			// This checks that volume-slider was manually set
			if (mutation.oldValue !== mutation.target.value &&
				(!options.savedVolume || Math.abs(options.savedVolume - mutation.target.value) > 4)) {
				// Diff>4 means it was manually set
				setTooltip(mutation.target.value);
				saveVolume(mutation.target.value, options);
			}
		}
	});

	// Observing only changes in 'value' of volume-slider
	observer.observe(document.querySelector("#volume-slider"), {
		attributeFilter: ["value"],
		attributeOldValue: true
	});
}

// Set new volume as tooltip for volume slider and icon + expanding slider (appears when window size is small)
const tooltipTargets = [
	"#volume-slider",
	"tp-yt-paper-icon-button.volume.style-scope.ytmusic-player-bar",
	"#expand-volume-slider",
	"#expand-volume"
];

function setTooltip(newValue) {
	newValue += "%";
	for (target of tooltipTargets) {
		document.querySelector(target).title = newValue;
	}
}

function toPercent(volume) {
	return Math.round(Number.parseFloat(volume) * 100);
}

