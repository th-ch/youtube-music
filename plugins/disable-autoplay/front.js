module.exports = () => {
	document.addEventListener('apiLoaded', e => {
		document.querySelector('video').addEventListener('loadeddata', e => {
			e.target.pause();
		})
	})
};
