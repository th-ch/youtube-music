const defaultConfig = require("../../config/defaults");

module.exports = (options) => {
	const optionsWithDefaults = {
		...defaultConfig.plugins.visualizer,
		...options,
	};
	const VisualizerType = require(`./visualizers/${optionsWithDefaults.type}`);

	document.addEventListener(
		"audioCanPlay",
		(e) => {
			const video = document.querySelector("video");
			const visualizerContainer = document.querySelector("#player");

			let canvas = document.getElementById("visualizer");
			if (!canvas) {
				canvas = document.createElement("canvas");
				canvas.id = "visualizer";
				canvas.style.position = "absolute";
				canvas.style.background = "black";
				visualizerContainer.append(canvas);
			}

			const resizeCanvas = () => {
				canvas.width = visualizerContainer.clientWidth;
				canvas.height = visualizerContainer.clientHeight;
			};
			resizeCanvas();

			const gainNode = e.detail.audioContext.createGain();
			gainNode.gain.value = 1.25;
			e.detail.audioSource.connect(gainNode);

			const visualizer = new VisualizerType(
				e.detail.audioContext,
				e.detail.audioSource,
				visualizerContainer,
				canvas,
				gainNode,
				video.captureStream(),
				optionsWithDefaults[optionsWithDefaults.type]
			);

			const resizeVisualizer = (width, height) => {
				resizeCanvas();
				visualizer.resize(width, height);
			};
			resizeVisualizer(canvas.width, canvas.height);
			const visualizerContainerObserver = new ResizeObserver((entries) => {
				entries.forEach((entry) => {
					resizeVisualizer(entry.contentRect.width, entry.contentRect.height);
				});
			});
			visualizerContainerObserver.observe(visualizerContainer);

			visualizer.render();
		},
		{ passive: true }
	);
};
