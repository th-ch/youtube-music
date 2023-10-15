import { ConfigType } from '../../config/dynamic';

export default (_: ConfigType<'ambient-mode'>) => {
  const interpolationTime = 3000; // interpolation time (ms)
  const framerate = 30; // frame
  const qualityRatio = 50; // width size (pixel)

  let unregister: (() => void) | null = null;

  const injectBlurVideo = (): (() => void) | null => {
    const songVideo = document.querySelector<HTMLDivElement>('#song-video');
    const video = document.querySelector<HTMLVideoElement>('#song-video .html5-video-container > video');
    const wrapper = document.querySelector('#song-video > .player-wrapper');

    if (!songVideo) return null;
    if (!video) return null;
    if (!wrapper) return null;

    const blurCanvas = document.createElement('canvas');
    blurCanvas.classList.add('html5-blur-canvas');

    const context = blurCanvas.getContext('2d', { willReadFrequently: true });

    /* effect */
    let lastEffectWorkId: number | null = null;
    let lastImageData: ImageData | null = null;
    
    const onSync = () => {
      if (typeof lastEffectWorkId === 'number') cancelAnimationFrame(lastEffectWorkId);

      lastEffectWorkId = requestAnimationFrame(() => {
        if (!context) return;

        const width = qualityRatio;
        let height = Math.max(Math.floor(blurCanvas.height / blurCanvas.width * width), 1);
        if (!Number.isFinite(height)) height = width;

        context.globalAlpha = 1;
        if (lastImageData) {
          const frameOffset = (1 / framerate) * (1000 / interpolationTime);
          context.globalAlpha = 1 - (frameOffset * 2); // because of alpha value must be < 1
          context.putImageData(lastImageData, 0, 0);
          context.globalAlpha = frameOffset;
        }
        context.drawImage(video, 0, 0, width, height);

        const nowImageData = context.getImageData(0, 0, width, height);
        lastImageData = nowImageData;

        lastEffectWorkId = null;
      });
    };

    const applyVideoAttributes = () => {
      const rect = video.getBoundingClientRect();

      const newWidth = Math.floor(video.width || rect.width);
      const newHeight = Math.floor(video.height || rect.height);

      if (newWidth === 0 || newHeight === 0) return;

      blurCanvas.width = qualityRatio;
      blurCanvas.height = Math.floor(newHeight / newWidth * qualityRatio);
      blurCanvas.style.width = `${newWidth}px`;
      blurCanvas.style.height = `${newHeight}px`;
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          applyVideoAttributes();
        }
      });
    });
    const resizeObserver = new ResizeObserver(() => {
      applyVideoAttributes();
    });

    /* hooking */
    let canvasInterval: NodeJS.Timeout | null = null;
    canvasInterval = setInterval(onSync, Math.max(1, Math.ceil(1000 / framerate)));
    applyVideoAttributes();
    observer.observe(songVideo, { attributes: true });
    resizeObserver.observe(songVideo);
    window.addEventListener('resize', applyVideoAttributes);

    const onPause = () => {
      if (canvasInterval) clearInterval(canvasInterval);
      canvasInterval = null;
    };
    const onPlay = () => {
      if (canvasInterval) clearInterval(canvasInterval);
      canvasInterval = setInterval(onSync, Math.max(1, Math.ceil(1000 / framerate)));
    };
    songVideo.addEventListener('pause', onPause);
    songVideo.addEventListener('play', onPlay);

    /* injecting */
    wrapper.prepend(blurCanvas);

    /* cleanup */
    return () => {
      if (canvasInterval) clearInterval(canvasInterval);

      songVideo.removeEventListener('pause', onPause);
      songVideo.removeEventListener('play', onPlay);

      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', applyVideoAttributes);

      wrapper.removeChild(blurCanvas);
    };
  };

  
  const playerPage = document.querySelector<HTMLElement>('#player-page');
  const ytmusicAppLayout = document.querySelector<HTMLElement>('#layout');
  
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'attributes') {
        const isPageOpen = ytmusicAppLayout?.hasAttribute('player-page-open');
        if (isPageOpen) {
          unregister?.();
          unregister = injectBlurVideo() ?? null;
        } else {
          unregister?.();
          unregister = null;
        }
      }
    }
  });

  if (playerPage) {
    observer.observe(playerPage, { attributes: true });
  }
};