const {	getSongMenu } = require("../../providers/dom-elements");
const { ElementFromFile, templatePath } = require("../utils");

function $(selector) { return document.querySelector(selector); }

const slider = ElementFromFile(templatePath(__dirname, "slider.html"));

const MIN_PLAYBACK_SPEED = 0.25;
const MAX_PLAYBACK_SPEED = 2;

let playbackSpeed = 1;

const computePlayBackSpeed = (playbackSpeedPercentage) => {
	if (playbackSpeedPercentage <= 50) {  // = Playback speed <= 1
		// Slow down video by setting a playback speed between MIN_PLAYBACK_SPEED and 1
		return (
			MIN_PLAYBACK_SPEED +
			((1 - MIN_PLAYBACK_SPEED) / 50) * playbackSpeedPercentage
		).toFixed(2);
	}

	// Accelerate video by setting a playback speed between 1 and MAX_PLAYBACK_SPEED
	return (1 + ((MAX_PLAYBACK_SPEED - 1) / 50) * (playbackSpeedPercentage - 50)).toFixed(2);
};

const updatePlayBackSpeed = () => {
	$('video').playbackRate = playbackSpeed;

	const playbackSpeedElement = $("#playback-speed-value");
	if (playbackSpeedElement) {
		playbackSpeedElement.innerHTML = playbackSpeed;
	}
};

let menu;

const observePopupContainer = () => {
	const observer = new MutationObserver(() => {
		if (!menu) {
			menu = getSongMenu();
		}

		if (menu && !menu.contains(slider)) {
			menu.prepend(slider);
			$('#playback-speed-slider').addEventListener("immediate-value-change", () => {
				playbackSpeed = computePlayBackSpeed($('#playback-speed-slider #sliderBar').value);
				if (isNaN(playbackSpeed)) {
					playbackSpeed = 1;
				}
				updatePlayBackSpeed();
			})
		}
	});

	observer.observe($('ytmusic-popup-container'), {
		childList: true,
		subtree: true,
	});
};

const observeVideo = () => {
	$('video').addEventListener('ratechange', forcePlaybackRate)
	$('video').addEventListener('loadeddata', forcePlaybackRate)
}

function forcePlaybackRate (e) {
	if (e.target.playbackRate !== playbackSpeed) {
		e.target.playbackRate = playbackSpeed
	}
}

module.exports = () => {
	document.addEventListener('apiLoaded', e => {
		observePopupContainer();
		observeVideo();
	})
};
