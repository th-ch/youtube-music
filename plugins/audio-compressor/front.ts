export default () =>
  document.addEventListener('audioCanPlay', (e) => {
    const { audioContext } = e.detail;

    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.ratio.value = 12;
    compressor.knee.value = 40;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    e.detail.audioSource.connect(compressor);
    compressor.connect(audioContext.destination);
  }, {
    once: true, // Only create the audio compressor once, not on each video
    passive: true,
  });
