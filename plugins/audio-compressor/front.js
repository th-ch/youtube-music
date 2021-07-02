const applyCompressor = () => {
	const videoElement = document.querySelector("video");

	// If video element is not loaded yet try again
	if(videoElement === null) {
		setTimeout(applyCompressor, 500);
		return;
	}

	const audioContext = new AudioContext();
	
	let compressor = audioContext.createDynamicsCompressor();
	compressor.threshold.value = -50;
	compressor.ratio.value = 12;
	compressor.knee.value = 40;
	compressor.attack.value = 0;
	compressor.release.value = 0.25;

	const source = audioContext.createMediaElementSource(videoElement);

	source.connect(compressor);
	compressor.connect(audioContext.destination);
};

module.exports = applyCompressor;