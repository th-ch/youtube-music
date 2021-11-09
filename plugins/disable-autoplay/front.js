module.exports = () => {
	document.addEventListener('apiLoaded', e => {
		document.querySelector('video').addEventListener('srcChanged', () => {
			e.detail.pauseVideo();
		})
	}, { once: true, passive: true })
};
