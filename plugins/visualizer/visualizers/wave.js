const { Wave } = require("@foobar404/wave");

class WaveVisualizer {
	constructor(
		audioContext,
		audioSource,
		visualizerContainer,
		canvas,
		audioNode,
		stream,
		options
	) {
		this.visualizer = new Wave(
			{ context: audioContext, source: audioSource },
			canvas
		);
		options.animations.forEach((animation) => {
			this.visualizer.addAnimation(
				eval(`new this.visualizer.animations.${animation.type}(
					${JSON.stringify(animation.config)}
				)`)
			);
		});
	}

	resize(width, height) {}

	render() {}
}

module.exports = WaveVisualizer;
