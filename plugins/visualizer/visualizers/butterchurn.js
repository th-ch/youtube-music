const butterchurn = require("butterchurn");
const butterchurnPresets = require("butterchurn-presets");

const presets = butterchurnPresets.getPresets();

class ButterchurnVisualizer {
	constructor(
		audioContext,
		audioSource,
		visualizerContainer,
		canvas,
		audioNode,
		stream,
		options
	) {
		this.visualizer = butterchurn.default.createVisualizer(
			audioContext,
			canvas,
			{
				width: canvas.width,
				height: canvas.height,
			}
		);

		const preset = presets[options.preset];
		this.visualizer.loadPreset(preset, options.blendTimeInSeconds);

		this.visualizer.connectAudio(audioNode);

		this.renderingFrequencyInMs = options.renderingFrequencyInMs;
	}

	resize(width, height) {
		this.visualizer.setRendererSize(width, height);
	}

	render() {
		const renderVisualizer = () => {
			requestAnimationFrame(() => renderVisualizer());
			this.visualizer.render();
		};
		setTimeout(renderVisualizer(), this.renderingFrequencyInMs);
	}
}

module.exports = ButterchurnVisualizer;
