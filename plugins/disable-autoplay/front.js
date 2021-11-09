module.exports = () => {
	document.addEventListener('apiLoaded', () => {
		document.querySelector('video').addEventListener('srcChanged', e => {
			e.target.pause();
		})
	}, { once: true, passive: true })
};
