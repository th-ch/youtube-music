const { Wave } = require('@foobar404/wave');

class WaveVisualizer {
  constructor(
    audioContext,
    audioSource,
    visualizerContainer,
    canvas,
    audioNode,
    stream,
    options,
  ) {
    this.visualizer = new Wave(
      { context: audioContext, source: audioSource },
      canvas,
    );
    for (const animation of options.animations) {
      this.visualizer.addAnimation(
        eval(`new this.visualizer.animations.${animation.type}(
          ${JSON.stringify(animation.config)}
        )`),
      );
    }
  }

  // eslint-disable-next-line no-unused-vars
  resize(width, height) {
  }

  render() {
  }
}

module.exports = WaveVisualizer;
