import type { ConfigType } from '../../config/dynamic';

type SkipSilencesOptions = ConfigType<'skip-silences'>;

export default (options: SkipSilencesOptions) => {
  let isSilent = false;
  let hasAudioStarted = false;

  const smoothing = 0.1;
  const threshold = -100; // DB (-100 = absolute silence, 0 = loudest)
  const interval = 2; // Ms
  const history = 10;
  const speakingHistory = Array.from({ length: history }).fill(0) as number[];

  document.addEventListener(
    'audioCanPlay',
    (e) => {
      const video = document.querySelector('video');
      const { audioContext } = e.detail;
      const sourceNode = e.detail.audioSource;

      // Use an audio analyser similar to Hark
      // https://github.com/otalk/hark/blob/master/hark.bundle.js
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = smoothing;
      const fftBins = new Float32Array(analyser.frequencyBinCount);

      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);

      const looper = () => {
        setTimeout(() => {
          const currentVolume = getMaxVolume(analyser, fftBins);

          let history = 0;
          if (currentVolume > threshold && isSilent) {
            // Trigger quickly, short history
            for (
              let i = speakingHistory.length - 3;
              i < speakingHistory.length;
              i++
            ) {
              history += speakingHistory[i];
            }

            if (history >= 2) {
              // Not silent
              isSilent = false;
              hasAudioStarted = true;
            }
          } else if (currentVolume < threshold && !isSilent) {
            for (const element of speakingHistory) {
              history += element;
            }

            if (history == 0 // Silent

              && !(
                video && (
                  video.paused
                  || video.seeking
                  || video.ended
                  || video.muted
                  || video.volume === 0
                )
              )
            ) {
              isSilent = true;
              skipSilence();
            }
          }

          speakingHistory.shift();
          speakingHistory.push(Number(currentVolume > threshold));

          looper();
        }, interval);
      };

      looper();

      const skipSilence = () => {
        if (options.onlySkipBeginning && hasAudioStarted) {
          return;
        }

        if (isSilent && video && !video.paused) {
          video.currentTime += 0.2; // In s
        }
      };

      video?.addEventListener('play', () => {
        hasAudioStarted = false;
        skipSilence();
      });

      video?.addEventListener('seeked', () => {
        hasAudioStarted = false;
        skipSilence();
      });
    },
    {
      passive: true,
    },
  );
};

function getMaxVolume(analyser: AnalyserNode, fftBins: Float32Array) {
  let maxVolume = Number.NEGATIVE_INFINITY;
  analyser.getFloatFrequencyData(fftBins);

  for (let i = 4, ii = fftBins.length; i < ii; i++) {
    if (fftBins[i] > maxVolume && fftBins[i] < 0) {
      maxVolume = fftBins[i];
    }
  }

  return maxVolume;
}
