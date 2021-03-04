let videoElement = null;

const observer = new MutationObserver((mutations, observer) => {
	if (!videoElement) {
		videoElement = document.querySelector("video");
	}

	if (videoElement) {
		videoElement.ontimeupdate = () => {
			if (videoElement.currentTime === 0 && videoElement.duration !== NaN) {
				// auto-confirm-when-paused plugin can interfere here if not disabled!
				videoElement.pause();
			}
		};
	}
});

function observeVideoElement() {
	observer.observe(document, {
		childList: true,
		subtree: true,
	});
}

module.exports = observeVideoElement;
