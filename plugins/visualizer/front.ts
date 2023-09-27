import { Visualizer } from './visualizers/visualizer';

import vudio from './visualizers/vudio';
import wave from './visualizers/wave';
import butterchurn from './visualizers/butterchurn';

import defaultConfig from '../../config/defaults';

import type { ConfigType } from '../../config/dynamic';

export default (options: ConfigType<'visualizer'>) => {
  const optionsWithDefaults = {
    ...defaultConfig.plugins.visualizer,
    ...options,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let visualizerType: { new(...args: any[]): Visualizer<unknown> } = vudio;

  if (optionsWithDefaults.type === 'wave') {
    visualizerType = wave;
  } else if (optionsWithDefaults.type === 'butterchurn') {
    visualizerType = butterchurn;
  }

  document.addEventListener(
    'audioCanPlay',
    (e) => {
      const video = document.querySelector('video') as (HTMLVideoElement & { captureStream(): MediaStream; });
      const visualizerContainer = document.querySelector('#player') as HTMLElement;

      let canvas = document.querySelector('#visualizer') as HTMLCanvasElement;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'visualizer';
        visualizerContainer.prepend(canvas);
      }

      const resizeCanvas = () => {
        canvas.width = visualizerContainer.clientWidth;
        canvas.height = visualizerContainer.clientHeight;
      };

      resizeCanvas();

      const gainNode = e.detail.audioContext.createGain();
      gainNode.gain.value = 1.25;
      e.detail.audioSource.connect(gainNode);

      const visualizer = new visualizerType(
        e.detail.audioContext,
        e.detail.audioSource,
        visualizerContainer,
        canvas,
        gainNode,
        video.captureStream(),
        optionsWithDefaults,
      );

      const resizeVisualizer = (width: number, height: number) => {
        resizeCanvas();
        visualizer.resize(width, height);
      };

      resizeVisualizer(canvas.width, canvas.height);
      const visualizerContainerObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          resizeVisualizer(entry.contentRect.width, entry.contentRect.height);
        }
      });
      visualizerContainerObserver.observe(visualizerContainer);

      visualizer.render();
    },
    { passive: true },
  );
};
