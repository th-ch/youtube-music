const { ipcRenderer, remote } = require("electron");

const { setOptions } = require("../../config/plugins");

function $(selector) { return document.querySelector(selector); }
let api;

module.exports = (options) => {
	document.addEventListener('apiLoaded', e => {
		api = e.detail;
		firstRun(options);
	}, { once: true, passive: true })
};

/** Restore saved volume and setup tooltip */
function firstRun(options) {
	if (typeof options.savedVolume === "number") {
		// Set saved volume as tooltip
		setTooltip(options.savedVolume);

		if (api.getVolume() !== options.savedVolume) {
			api.setVolume(options.savedVolume);
		}
	}

	setupPlaybar(options);

	setupLocalArrowShortcuts(options);

	setupGlobalShortcuts(options);

	const noVid = $("#main-panel")?.computedStyleMap().get("display").value === "none";
	injectVolumeHud(noVid);
	if (!noVid) {
		setupVideoPlayerOnwheel(options);
	}
}

function injectVolumeHud(noVid) {
	if (noVid) {
		const position = "top: 18px; right: 60px; z-index: 999; position: absolute;";
		const mainStyle = "font-size: xx-large; padding: 10px; transition: opacity 1s; pointer-events: none;";

		$(".center-content.ytmusic-nav-bar").insertAdjacentHTML("beforeend",
			`<span id="volumeHud" style="${position + mainStyle}"></span>`)
	} else {
		const position = `top: 10px; left: 10px; z-index: 999; position: absolute;`;
		const mainStyle = "font-size: xxx-large; padding: 10px; transition: opacity 0.6s; webkit-text-stroke: 1px black; font-weight: 600; pointer-events: none;";

		$("#song-video").insertAdjacentHTML('afterend',
			`<span id="volumeHud" style="${position + mainStyle}"></span>`)
	}
}

let hudFadeTimeout;

function showVolumeHud(volume) {
	let volumeHud = $("#volumeHud");
	if (!volumeHud) return;

	volumeHud.textContent = volume + '%';
	volumeHud.style.opacity = 1;

	if (hudFadeTimeout) {
		clearTimeout(hudFadeTimeout);
	}

	hudFadeTimeout = setTimeout(() => {
		volumeHud.style.opacity = 0;
		hudFadeTimeout = null;
	}, 2000);
}

/** Add onwheel event to video player */
function setupVideoPlayerOnwheel(options) {
	$("#main-panel").addEventListener("wheel", event => {
		event.preventDefault();
		// Event.deltaY < 0 means wheel-up
		changeVolume(event.deltaY < 0, options);
	});
}

function saveVolume(volume, options) {
	options.savedVolume = volume;
	writeOptions(options);
}

//without this function it would rewrite config 20 time when volume change by 20
let writeTimeout;
function writeOptions(options) {
	if (writeTimeout) clearTimeout(writeTimeout);

	writeTimeout = setTimeout(() => {
		setOptions("precise-volume", options);
		writeTimeout = null;
	}, 1500)
}

/** Add onwheel event to play bar and also track if play bar is hovered*/
function setupPlaybar(options) {
	const playerbar = $("ytmusic-player-bar");

	playerbar.addEventListener("wheel", event => {
		event.preventDefault();
		// Event.deltaY < 0 means wheel-up
		changeVolume(event.deltaY < 0, options);
	});

	// Keep track of mouse position for showVolumeSlider()
	playerbar.addEventListener("mouseenter", () => {
		playerbar.classList.add("on-hover");
	});

	playerbar.addEventListener("mouseleave", () => {
		playerbar.classList.remove("on-hover");
	});

	setupSliderObserver(options);
}

/** Save volume + Update the volume tooltip when volume-slider is manually changed */
function setupSliderObserver(options) {
	const sliderObserver = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			// This checks that volume-slider was manually set
			if (mutation.oldValue !== mutation.target.value &&
				(typeof options.savedVolume !== "number" || Math.abs(options.savedVolume - mutation.target.value) > 4)) {
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

/** if (toIncrease = false) then volume decrease */
function changeVolume(toIncrease, options) {
	// Apply volume change if valid
	const steps = (options.steps || 1);
	api.setVolume(toIncrease ?
		Math.min(api.getVolume() + steps, 100) :
		Math.max(api.getVolume() - steps, 0));

	// Save the new volume
	saveVolume(api.getVolume(), options);

	// change slider position (important)
	updateVolumeSlider(options);

	// Change tooltips to new value
	setTooltip(options.savedVolume);
	// Show volume slider
	showVolumeSlider();
	// Show volume HUD
	showVolumeHud(options.savedVolume);
}

function updateVolumeSlider(options) {
	// Slider value automatically rounds to multiples of 5
	$("#volume-slider").value = options.savedVolume > 0 && options.savedVolume < 5 ?
		5 : options.savedVolume;
}

let volumeHoverTimeoutID;

function showVolumeSlider() {
	const slider = $("#volume-slider");
	// This class display the volume slider if not in minimized mode
	slider.classList.add("on-hover");
	// Reset timeout if previous one hasn't completed
	if (volumeHoverTimeoutID) {
		clearTimeout(volumeHoverTimeoutID);
	}
	// Timeout to remove volume preview after 3 seconds if playbar isn't hovered
	volumeHoverTimeoutID = setTimeout(() => {
		volumeHoverTimeoutID = null;
		if (!$("ytmusic-player-bar").classList.contains("on-hover")) {
			slider.classList.remove("on-hover");
		}
	}, 3000);
}

// Set new volume as tooltip for volume slider and icon + expanding slider (appears when window size is small)
const tooltipTargets = [
	"#volume-slider",
	"tp-yt-paper-icon-button.volume",
	"#expand-volume-slider",
	"#expand-volume"
];

function setTooltip(volume) {
	for (target of tooltipTargets) {
		$(target).title = `${volume}%`;
	}
}

function setupGlobalShortcuts(options) {
	if (options.globalShortcuts.volumeUp) {
		remote.globalShortcut.register((options.globalShortcuts.volumeUp), () => changeVolume(true, options));
	}
	if (options.globalShortcuts.volumeDown) {
		remote.globalShortcut.register((options.globalShortcuts.volumeDown), () => changeVolume(false, options));
	}
}

function setupLocalArrowShortcuts(options) {
	if (options.arrowsShortcut) {
		addListener();
	}

	// Change options from renderer to keep sync
	ipcRenderer.on("setArrowsShortcut", (_event, isEnabled) => {
		options.arrowsShortcut = isEnabled;
		setOptions("precise-volume", options);
		// This allows changing this setting without restarting app
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
				event.preventDefault();
				changeVolume(true, options);
				break;
			case "ArrowDown":
				event.preventDefault();
				changeVolume(false, options);
				break;
		}
	}
}
