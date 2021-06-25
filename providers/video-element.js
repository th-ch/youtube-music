let videoElement = null;

module.exports.ontimeupdate = (cb) => {
	const observer = new MutationObserver((mutations, observer) => {
		if (!videoElement) {
			videoElement = document.querySelector("video");
			if (videoElement) {
				observer.disconnect();
				videoElement.ontimeupdate = () => cb(videoElement);
			}
		}
	});

	if (!videoElement) {
		observer.observe(document, {
			childList: true,
			subtree: true,
		});
	} else {
		videoElement.ontimeupdate = () => cb(videoElement);
	}
};
