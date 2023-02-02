const Vudio = require("vudio/umd/vudio");

class VudioVisualizer {
	constructor(
		audioContext,
		audioSource,
		visualizerContainer,
		canvas,
		audioNode,
		stream,
		options
	) {
		this.visualizer = new Vudio(stream, canvas, {
			width: canvas.width,
			height: canvas.height,
			// Visualizer config
			...options,
		});
	}

	resize(width, height) {
		this.visualizer.setOption({
			width: width,
			height: height,
		});
	}

	render() {
		this.visualizer.dance();
	}
}

module.exports = VudioVisualizer;
