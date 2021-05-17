const {
	watchDOMElement
} = require("../../providers/dom-elements");

let videoElement;

const applyCompressor = () => {
	var audioContext = new AudioContext();
	
	var compressor = audioContext.createDynamicsCompressor();
	compressor.threshold.value = -50;
	compressor.ratio.value = 12;
	compressor.knee.value = 40;
	compressor.attack.value = 0;
	compressor.release.value = 0.25;

	var source = audioContext.createMediaElementSource(videoElement);

	source.connect(compressor);
	compressor.connect(audioContext.destination);
};

module.exports = () => {
	watchDOMElement(
		"video",
		(document) => document.querySelector("video"),
		(element) => {
			videoElement = element;
			applyCompressor();
		}
	);
};
