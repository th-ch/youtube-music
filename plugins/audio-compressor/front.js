const applyCompressor = () => {
	const audioContext = new AudioContext();

	const compressor = audioContext.createDynamicsCompressor();
	compressor.threshold.value = -50;
	compressor.ratio.value = 12;
	compressor.knee.value = 40;
	compressor.attack.value = 0;
	compressor.release.value = 0.25;

	const source = audioContext.createMediaElementSource(document.querySelector("video"));

	source.connect(compressor);
	compressor.connect(audioContext.destination);
};

module.exports = () => document.addEventListener('apiLoaded', applyCompressor, { once: true, passive: true });
