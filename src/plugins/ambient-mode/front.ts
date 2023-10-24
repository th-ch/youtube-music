import { ipcRenderer } from 'electron';

import { ConfigType } from '../../config/dynamic';

export default (config: ConfigType<'ambient-mode'>) => {
  let interpolationTime = config.interpolationTime; // interpolation time (ms)
  let buffer = config.buffer; // frame
  let qualityRatio = config.quality; // width size (pixel)
  let sizeRatio = config.size / 100; // size ratio (percent)
  let blur = config.blur; // blur (pixel)
  let opacity = config.opacity; // opacity (percent)
  let isFullscreen = config.fullscreen; // fullscreen (boolean)

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
          const frameOffset = (1 / buffer) * (1000 / interpolationTime);
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
      blurCanvas.style.width = `${newWidth * sizeRatio}px`;
      blurCanvas.style.height = `${newHeight * sizeRatio}px`;

      if (isFullscreen) blurCanvas.classList.add('fullscreen');
      else blurCanvas.classList.remove('fullscreen');

      const leftOffset = newWidth * (sizeRatio - 1) / 2;
      const topOffset = newHeight * (sizeRatio - 1) / 2;
      blurCanvas.style.setProperty('--left', `${-1 * leftOffset}px`);
      blurCanvas.style.setProperty('--top', `${-1 * topOffset}px`);
      blurCanvas.style.setProperty('--blur', `${blur}px`);
      blurCanvas.style.setProperty('--opacity', `${opacity}`);
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
    const onConfigSync = (_: Electron.IpcRendererEvent, newConfig: ConfigType<'ambient-mode'>) => {
      if (typeof newConfig.interpolationTime === 'number') interpolationTime = newConfig.interpolationTime;
      if (typeof newConfig.buffer === 'number') buffer = newConfig.buffer;
      if (typeof newConfig.quality === 'number') qualityRatio = newConfig.quality;
      if (typeof newConfig.size === 'number') sizeRatio = newConfig.size / 100;
      if (typeof newConfig.blur === 'number') blur = newConfig.blur;
      if (typeof newConfig.opacity === 'number') opacity = newConfig.opacity;
      if (typeof newConfig.fullscreen === 'boolean') isFullscreen = newConfig.fullscreen;

      applyVideoAttributes();
    };
    ipcRenderer.on('ambient-mode:config-change', onConfigSync);
  
    /* hooking */
    let canvasInterval: NodeJS.Timeout | null = null;
    canvasInterval = setInterval(onSync, Math.max(1, Math.ceil(1000 / buffer)));
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
      canvasInterval = setInterval(onSync, Math.max(1, Math.ceil(1000 / buffer)));
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
      ipcRenderer.off('ambient-mode:config-change', onConfigSync);
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