module.exports = () => {
	document.addEventListener('apiLoaded', () => {
		document.querySelector('video').addEventListener('loadeddata', e => {
			e.target.pause();
		})
	}, { once: true, passive: true })
};
