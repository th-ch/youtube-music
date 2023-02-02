const applyCompressor = (e) => {
	const audioContext = e.detail.audioContext;

	const compressor = audioContext.createDynamicsCompressor();
	compressor.threshold.value = -50;
	compressor.ratio.value = 12;
	compressor.knee.value = 40;
	compressor.attack.value = 0;
	compressor.release.value = 0.25;

	e.detail.audioSource.connect(compressor);
	compressor.connect(audioContext.destination);
};

module.exports = () =>
	document.addEventListener("audioCanPlay", applyCompressor, {
		once: true, // Only create the audio compressor once, not on each video
		passive: true,
	});
