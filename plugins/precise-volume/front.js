const { setOptions } = require("../../config/plugins");
const { ipcRenderer } = require("electron");
function $(selector){ return document.querySelector(selector); }

module.exports = (options) => {
	setPlaybarOnwheel(options);
	setupSliderObserver(options);
	setupArrowShortcuts(options);
	firstRun(options);
};

function toPercent(volume) {
	return Math.round(Number.parseFloat(volume) * 100);
}

function saveVolume(volume, options) {
	options.savedVolume = volume;
	setOptions("precise-volume", options);
}

function firstRun(options) {
	const videoStream = $(".video-stream");
	const slider = $("#volume-slider");
	// Those elements load abit after DOMContentLoaded
	if (videoStream && slider) {
		// Set saved volume IF it pass checks
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
	$("ytmusic-player-bar").onwheel = event => {
		event.preventDefault();
		// Event.deltaY < 0 means wheel-up
		changeVolume(event.deltaY < 0, options);
	};
}

// (increase = false) means volume decrease
function changeVolume(increase, options) {
	// Need to change both the actual volume and the slider
	const videoStream = $(".video-stream");
	
	// Apply volume change if valid
	const steps = options.steps / 100;
	videoStream.volume = increase ?
		Math.min(videoStream.volume + steps, 1) :
		Math.max(videoStream.volume - steps, 0);

	// Save the new volume
	saveVolume(toPercent(videoStream.volume), options);
	// Slider value automatically rounds to multiples of 5
	$("#volume-slider").value = options.savedVolume;
	// Finally change tooltip to new value
	setTooltip(options.savedVolume);
}

// Save volume + Update the volume tooltip when volume-slider is manually changed
function setupSliderObserver(options) {
	const sliderObserver = new MutationObserver(mutations => {
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
	sliderObserver.observe($("#volume-slider"), {
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

function setTooltip(volume) {
	for (target of tooltipTargets) {
		$(target).title =  `${volume}%`;
	}
}

function setupArrowShortcuts(options) {
	// Register shortcuts if enabled
	if (options.arrowsShortcut) {
		addListener();
	}

	// Change options from renderer to keep sync
	ipcRenderer.on("setArrowsShortcut", (_event, isEnabled) => {
		options.arrowsShortcut = isEnabled;
		setOptions("precise-volume", options);
		// This allows changing setting without restarting app
		if (isEnabled) {
			addListener();
		} else {
			removeListener();
		}
	});

	function addListener() {
		window.addEventListener('keydown', callback);
	}

	function removeListener() {
		window.removeEventListener("keydown", callback);
	}

	function callback(event) {
		switch (event.code) {
			case "ArrowUp":
				changeVolume(true, options);
				break;
			case "ArrowDown":
				changeVolume(false, options);
				break;
		}
	}
}
