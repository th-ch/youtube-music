import Vudio from 'vudio';

import { Visualizer } from './visualizer';

import type { ConfigType } from '../../../config/dynamic';

class VudioVisualizer extends Visualizer<Vudio> {
  visualizer: Vudio;

  constructor(
    audioContext: AudioContext,
    audioSource: MediaElementAudioSourceNode,
    visualizerContainer: HTMLElement,
    canvas: HTMLCanvasElement,
    audioNode: GainNode,
    stream: MediaStream,
    options: ConfigType<'visualizer'>,
  ) {
    super(
      audioContext,
      audioSource,
      visualizerContainer,
      canvas,
      audioNode,
      stream,
      options,
    );

    this.visualizer = new Vudio(stream, canvas, {
      width: canvas.width,
      height: canvas.height,
      // Visualizer config
      ...options,
    });
  }

  resize(width: number, height: number) {
    this.visualizer.setOptions({
      width,
      height,
    });
  }

  render() {
    this.visualizer.dance();
  }
}

export default VudioVisualizer;
