module.exports = () => {
	setPlaybarOnwheel();
	setObserver();
	setFirstTooltip();
};

function setFirstTooltip() {
	const videoStream = document.querySelector(".video-stream");
	if (videoStream?.volume) {
		setTooltip(Math.round(parseFloat(videoStream.volume) * 100));
	} else {
		setTimeout(setFirstTooltip, 500); // Try again in 500 milliseconds
	}
}

function setPlaybarOnwheel() {
	// Add onwheel event to play bar
	document.querySelector("ytmusic-player-bar").onwheel = event => {
		event.preventDefault();
		// Event.deltaY < 0 => wheel up
		changeVolume(event.deltaY < 0);
	};
}

// The last volume set by changeVolume() is stored here
let newVolume; // Used to determine if volume-slider was manually moved

function changeVolume(increase) {
	// Need to change both the slider and the actual volume
	const videoStream = document.querySelector(".video-stream");
	const slider = document.querySelector("#volume-slider");
	// Get the volume diff to apply
	const diff = increase ?
		(videoStream.volume < 1 ? 0.01 : 0) :
		(videoStream.volume > 0 ? -0.01 : 0);
	// Apply on both elements and save the new volume
	videoStream.volume += diff;
	newVolume = Math.round(Number.parseFloat(videoStream.volume) * 100);
	// Slider value automatically rounds to multiples of 5
	slider.value = newVolume;
	// Finally change tooltip to new value
	setTooltip(newVolume);
}

// Update the volume tooltip when volume-slider is manually changed
function setObserver() {
	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			// This checks that volume-slider was manually set
			if (mutation.oldValue !== mutation.target.value &&
                (!newVolume || Math.abs(newVolume - mutation.target.value) > 4)) {
				// Diff>4 means it was manually set, so update tooltip accordingly
				setTooltip(mutation.target.value);
			}
		}
	});

	// Observing only changes in 'value' of volume-slider
	observer.observe(document.querySelector("#volume-slider"), {
		attributeFilter: ["value"],
		attributeOldValue: true
	});
}

function setTooltip(newValue) {
	newValue += "%";
	// Set new volume as tooltip for volume slider and icon
	document.querySelector("#volume-slider").title = newValue;
	document.querySelector("tp-yt-paper-icon-button.volume.style-scope.ytmusic-player-bar").title = newValue;

	// Also for expanding slider (appears when window size is small)
	const expandingSlider = document.querySelector("#expanding-menu");
	expandingSlider.querySelector("#expand-volume-slider").title = newValue;
	expandingSlider.querySelector("#expand-volume").title = newValue;
}
