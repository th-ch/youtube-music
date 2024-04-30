import { createPlugin } from '@/utils';
import { t } from '@/i18n';

export default createPlugin({
  name: () => t('plugins.audio-compressor.name'),
  description: () => t('plugins.audio-compressor.description'),

  renderer() {
    document.addEventListener(
      'ytmd:audio-can-play',
      ({ detail: { audioSource, audioContext } }) => {
        const compressor = audioContext.createDynamicsCompressor();

        compressor.threshold.value = -50;
        compressor.ratio.value = 12;
        compressor.knee.value = 40;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;

        audioSource.connect(compressor);
        compressor.connect(audioContext.destination);
      },
      { once: true, passive: true },
    );
  },
});
