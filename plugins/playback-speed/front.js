const { watchDOMElement } = require("../../providers/dom-elements");
const { ElementFromFile, templatePath } = require("../utils");

const slider = ElementFromFile(templatePath(__dirname, "slider.html"));

const MIN_PLAYBACK_SPEED = 0.25;
const MAX_PLAYBACK_SPEED = 2;

let videoElement;
let playbackSpeedPercentage = 50; // = Playback speed of 1

const computePlayBackSpeed = () => {
	if (playbackSpeedPercentage <= 50) {
		// Slow down video by setting a playback speed between MIN_PLAYBACK_SPEED and 1
		return (
			MIN_PLAYBACK_SPEED +
			((1 - MIN_PLAYBACK_SPEED) / 50) * playbackSpeedPercentage
		);
	}

	// Accelerate video by setting a playback speed between 1 and MAX_PLAYBACK_SPEED
	return 1 + ((MAX_PLAYBACK_SPEED - 1) / 50) * (playbackSpeedPercentage - 50);
};

const updatePlayBackSpeed = () => {
	const playbackSpeed = Math.round(computePlayBackSpeed() * 100) / 100;

	if (!videoElement || videoElement.playbackRate === playbackSpeed) {
		return;
	}

	videoElement.playbackRate = playbackSpeed;

	const playbackSpeedElement = document.querySelector("#playback-speed-value");
	if (playbackSpeedElement) {
		playbackSpeedElement.innerHTML = playbackSpeed;
	}
};

module.exports = () => {
	watchDOMElement(
		"video",
		(document) => document.querySelector("video"),
		(element) => {
			videoElement = element;
			updatePlayBackSpeed();
		}
	);

	watchDOMElement(
		"menu",
		(document) =>
			document.querySelector("ytmusic-menu-popup-renderer paper-listbox"),
		(menuElement) => {
			if (!menuElement.contains(slider)) {
				menuElement.prepend(slider);
			}

			const playbackSpeedElement = document.querySelector(
				"#playback-speed-slider #sliderKnob .slider-knob-inner"
			);

			const playbackSpeedObserver = new MutationObserver((mutations) => {
				mutations.forEach(function (mutation) {
					if (mutation.type == "attributes") {
						const value = playbackSpeedElement.getAttribute("value");
						playbackSpeedPercentage = parseInt(value, 10);
						if (isNaN(playbackSpeedPercentage)) {
							playbackSpeedPercentage = 50;
						}
						updatePlayBackSpeed();
						return;
					}
				});
			});
			playbackSpeedObserver.observe(playbackSpeedElement, {
				attributes: true,
			});
		}
	);
};
