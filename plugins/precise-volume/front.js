const { ipcRenderer } = require("electron");

const { setOptions, setMenuOptions, isEnabled } = require("../../config/plugins");

function $(selector) { return document.querySelector(selector); }

const { debounce } = require("../../providers/decorators");

let api, options;

module.exports = (_options) => {
	options = _options;
	document.addEventListener('apiLoaded', e => {
		api = e.detail;
		ipcRenderer.on('changeVolume', (_, toIncrease) => changeVolume(toIncrease));
		ipcRenderer.on('setVolume', (_, value) => setVolume(value));
		firstRun();
	}, { once: true, passive: true })
};

//without this function it would rewrite config 20 time when volume change by 20
const writeOptions = debounce(() => {
	setOptions("precise-volume", options);
}, 1000);

module.exports.moveVolumeHud = debounce((showVideo) => {
	const volumeHud = $("#volumeHud");
	if (!volumeHud) return;
	volumeHud.style.top = showVideo
		? `${($("ytmusic-player").clientHeight - $("video").clientHeight) / 2}px`
		: 0;
}, 250);

const hideVolumeHud = debounce((volumeHud) => {
	volumeHud.style.opacity = 0;
}, 2000);

const hideVolumeSlider = debounce((slider) => {
	slider.classList.remove("on-hover");
}, 2500);


/** Restore saved volume and setup tooltip */
function firstRun() {
	if (typeof options.savedVolume === "number") {
		// Set saved volume as tooltip
		setTooltip(options.savedVolume);

		if (api.getVolume() !== options.savedVolume) {
			api.setVolume(options.savedVolume);
		}
	}

	setupPlaybar();

	setupLocalArrowShortcuts();

	const noVid = $("#main-panel")?.computedStyleMap().get("display").value === "none";
	injectVolumeHud(noVid);
	if (!noVid) {
		setupVideoPlayerOnwheel();
		if (!isEnabled('video-toggle')) {
			//video-toggle handles hud positioning on its own
			const videoMode = () => api.getPlayerResponse().videoDetails?.musicVideoType !== 'MUSIC_VIDEO_TYPE_ATV';
			$("video").addEventListener("srcChanged", () => moveVolumeHud(videoMode()));
		}
	}

	// Change options from renderer to keep sync
	ipcRenderer.on("setOptions", (_event, newOptions = {}) => {
		Object.assign(options, newOptions)
		setMenuOptions("precise-volume", options);
	});
}

function injectVolumeHud(noVid) {
	if (noVid) {
		const position = "top: 18px; right: 60px;";
		const mainStyle = "font-size: xx-large;";

		$(".center-content.ytmusic-nav-bar").insertAdjacentHTML("beforeend",
			`<span id="volumeHud" style="${position + mainStyle}"></span>`)
	} else {
		const position = `top: 10px; left: 10px;`;
		const mainStyle = "font-size: xxx-large; webkit-text-stroke: 1px black; font-weight: 600;";

		$("#song-video").insertAdjacentHTML('afterend',
			`<span id="volumeHud" style="${position + mainStyle}"></span>`)
	}
}

function showVolumeHud(volume) {
	const volumeHud = $("#volumeHud");
	if (!volumeHud) return;

	volumeHud.textContent = `${volume}%`;
	volumeHud.style.opacity = 1;

	hideVolumeHud(volumeHud);
}

/** Add onwheel event to video player */
function setupVideoPlayerOnwheel() {
	$("#main-panel").addEventListener("wheel", event => {
		event.preventDefault();
		// Event.deltaY < 0 means wheel-up
		changeVolume(event.deltaY < 0);
	});
}

function saveVolume(volume) {
	options.savedVolume = volume;
	writeOptions();
}

/** Add onwheel event to play bar and also track if play bar is hovered*/
function setupPlaybar() {
	const playerbar = $("ytmusic-player-bar");

	playerbar.addEventListener("wheel", event => {
		event.preventDefault();
		// Event.deltaY < 0 means wheel-up
		changeVolume(event.deltaY < 0);
	});

	// Keep track of mouse position for showVolumeSlider()
	playerbar.addEventListener("mouseenter", () => {
		playerbar.classList.add("on-hover");
	});

	playerbar.addEventListener("mouseleave", () => {
		playerbar.classList.remove("on-hover");
	});

	setupSliderObserver();
}

/** Save volume + Update the volume tooltip when volume-slider is manually changed */
function setupSliderObserver() {
	const sliderObserver = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			// This checks that volume-slider was manually set
			if (mutation.oldValue !== mutation.target.value &&
				(typeof options.savedVolume !== "number" || Math.abs(options.savedVolume - mutation.target.value) > 4)) {
				// Diff>4 means it was manually set
				setTooltip(mutation.target.value);
				saveVolume(mutation.target.value);
			}
		}
	});

	// Observing only changes in 'value' of volume-slider
	sliderObserver.observe($("#volume-slider"), {
		attributeFilter: ["value"],
		attributeOldValue: true
	});
}

function setVolume(value) {
	api.setVolume(value);
	// Save the new volume
	saveVolume(value);

	// change slider position (important)
	updateVolumeSlider();

	// Change tooltips to new value
	setTooltip(value);
	// Show volume slider
	showVolumeSlider();
	// Show volume HUD
	showVolumeHud(value);
}

/** if (toIncrease = false) then volume decrease */
function changeVolume(toIncrease) {
	// Apply volume change if valid
	const steps = Number(options.steps || 1);
	setVolume(toIncrease ?
				Math.min(api.getVolume() + steps, 100) :
				Math.max(api.getVolume() - steps, 0));
}

function updateVolumeSlider() {
	// Slider value automatically rounds to multiples of 5
	for (const slider of ["#volume-slider", "#expand-volume-slider"]) {
		$(slider).value =
			options.savedVolume > 0 && options.savedVolume < 5
				? 5
				: options.savedVolume;
	}
}

function showVolumeSlider() {
	const slider = $("#volume-slider");
	// This class display the volume slider if not in minimized mode
	slider.classList.add("on-hover");
	
	hideVolumeSlider(slider);
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

function setupLocalArrowShortcuts() {
	if (options.arrowsShortcut) {
		window.addEventListener('keydown', (event) => {
			if ($('ytmusic-search-box').opened) return;
			switch (event.code) {
				case "ArrowUp":
					event.preventDefault();
					changeVolume(true);
					break;
				case "ArrowDown":
					event.preventDefault();
					changeVolume(false);
					break;
			}
		});
	}
}
