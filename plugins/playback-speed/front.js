const { getSongMenu } = require("../../providers/dom-elements");
const { ElementFromFile, templatePath } = require("../utils");
const { singleton } = require("../../providers/decorators")

function $(selector) { return document.querySelector(selector); }

const slider = ElementFromFile(templatePath(__dirname, "slider.html"));

const roundToTwo = n => Math.round(n * 1e2) / 1e2;

const MIN_PLAYBACK_SPEED = 0.07;
const MAX_PLAYBACK_SPEED = 16;

let playbackSpeed = 1;

const updatePlayBackSpeed = () => {
	$('video').playbackRate = playbackSpeed;

	const playbackSpeedElement = $("#playback-speed-value");
	if (playbackSpeedElement) {
		playbackSpeedElement.innerHTML = playbackSpeed;
	}
};

let menu;

const setupSliderListener = singleton(() => {
	$('#playback-speed-slider').addEventListener('immediate-value-changed', e => {
		playbackSpeed = e.detail.value || MIN_PLAYBACK_SPEED;
		if (isNaN(playbackSpeed)) {
			playbackSpeed = 1;
		}
		updatePlayBackSpeed();
	})
});

const observePopupContainer = () => {
	const observer = new MutationObserver(() => {
		if (!menu) {
			menu = getSongMenu();
		}

		if (menu && menu.parentElement.eventSink_?.matches('ytmusic-menu-renderer.ytmusic-player-bar') && !menu.contains(slider)) {
			menu.prepend(slider);
			setupSliderListener();
		}
	});

	observer.observe($('ytmusic-popup-container'), {
		childList: true,
		subtree: true,
	});
};

const observeVideo = () => {
	$('video').addEventListener('ratechange', forcePlaybackRate)
	$('video').addEventListener('srcChanged', forcePlaybackRate)
}

const setupWheelListener = () => {
	slider.addEventListener('wheel', e => {
		e.preventDefault();
		if (isNaN(playbackSpeed)) {
			playbackSpeed = 1;
		}
		// e.deltaY < 0 means wheel-up
		playbackSpeed = roundToTwo(e.deltaY < 0 ?
			Math.min(playbackSpeed + 0.01, MAX_PLAYBACK_SPEED) :
			Math.max(playbackSpeed - 0.01, MIN_PLAYBACK_SPEED)
		);

		updatePlayBackSpeed();
		// update slider position
		$('#playback-speed-slider').value = playbackSpeed;
	})
}

function forcePlaybackRate(e) {
	if (e.target.playbackRate !== playbackSpeed) {
		e.target.playbackRate = playbackSpeed
	}
}

module.exports = () => {
	document.addEventListener('apiLoaded', () => {
		observePopupContainer();
		observeVideo();
		setupWheelListener();
	}, { once: true, passive: true })
};
