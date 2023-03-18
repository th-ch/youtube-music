const { Wave } = require('@foobar404/wave');

class WaveVisualizer {
  constructor({ audioContext, audioSource, canvas, options }) {
    this.visualizer = new Wave(
      { context: audioContext, source: audioSource },
      canvas,
    );
    options.animations.forEach((animation) => {
      this.visualizer.addAnimation(
        eval(`new this.visualizer.animations.${animation.type}(
					${JSON.stringify(animation.config)}
				)`),
      );
    });
  }

  resize() {}

  render() {}
}

module.exports = WaveVisualizer;
