const {	getSongMenu } = require("../../providers/dom-elements");
const { ElementFromFile, templatePath } = require("../utils");

function $(selector) { return document.querySelector(selector); }

const slider = ElementFromFile(templatePath(__dirname, "slider.html"));

const roundToTwo = (n) => Math.round( n * 1e2 ) / 1e2;

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
	return roundToTwo(1 + ((MAX_PLAYBACK_SPEED - 1) / 50) * (playbackSpeedPercentage - 50));
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

const setupSliderListeners = () => {
	slider.addEventListener('immediate-value-change', () => {
		playbackSpeed = computePlayBackSpeed($('#playback-speed-slider #sliderBar').value);
		if (isNaN(playbackSpeed)) {
			playbackSpeed = 1;
		}
		updatePlayBackSpeed();
	})
	slider.addEventListener('wheel', e => {
		if (playbackSpeed <= 0.07) return; // lowest possible speed
		e.preventDefault();
		if (isNaN(playbackSpeed)) {
			playbackSpeed = 1;
		}
		// e.deltaY < 0 means wheel-up
		playbackSpeed = roundToTwo(e.deltaY < 0 ? playbackSpeed + 0.01 : playbackSpeed - 0.01);
		updatePlayBackSpeed();
		$('#playback-speed-slider').value = playbackSpeed * 50;
	})
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
		setupSliderListeners();
	}, { once: true, passive: true })
};
