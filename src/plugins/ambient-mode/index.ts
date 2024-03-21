import style from './style.css?inline';

import { t } from '@/i18n';
import { createPlugin } from '@/utils';
import { menu } from './menu';
import { AmbientModePluginConfig } from './types';

const defaultConfig: AmbientModePluginConfig = {
  enabled: false,
  quality: 50,
  buffer: 30,
  interpolationTime: 1500,
  blur: 100,
  size: 100,
  opacity: 1,
  fullscreen: false,
};

export default createPlugin({
  name: () => t('plugins.ambient-mode.name'),
  description: () => t('plugins.ambient-mode.description'),
  restartNeeded: false,
  config: defaultConfig,
  stylesheets: [style],
  menu: menu,

  renderer: {
    interpolationTime: defaultConfig.interpolationTime,
    buffer: defaultConfig.buffer,
    qualityRatio: defaultConfig.quality,
    size: defaultConfig.size,
    blur: defaultConfig.blur,
    opacity: defaultConfig.opacity,
    isFullscreen: defaultConfig.fullscreen,

    unregister: null as (() => void) | null,
    update: null as (() => void) | null,
    observer: null as MutationObserver | null,

    async start({ getConfig }) {
      const config = await getConfig();
      this.interpolationTime = config.interpolationTime;
      this.buffer = config.buffer;
      this.qualityRatio = config.quality;
      this.size = config.size;
      this.blur = config.blur;
      this.opacity = config.opacity;
      this.isFullscreen = config.fullscreen;

      const injectBlurImage = () => {
        const songImage = document.querySelector<HTMLImageElement>('#song-image');
        const image = document.querySelector<HTMLImageElement>('#song-image yt-img-shadow > img');

        if (!songImage || !image) return null;

        const blurImage = document.createElement('img');
        blurImage.classList.add('html5-blur-image');
        blurImage.src = image.src;

        const applyImageAttribute = () => {
          if (this.isFullscreen) blurImage.classList.add('fullscreen');
          else blurImage.classList.remove('fullscreen');

          blurImage.style.setProperty('--width', `${this.size}%`);
          blurImage.style.setProperty('--height', `${this.size}%`);
          blurImage.style.setProperty('--blur', `${this.blur}px`);
          blurImage.style.setProperty('--opacity', `${this.opacity}`);
        };

        this.update = applyImageAttribute;

        applyImageAttribute();

        /* injecting */
        songImage.prepend(blurImage);

        /* cleanup */
        return () => {
          if (blurImage.isConnected) blurImage.remove();
        };
      };

      const injectBlurVideo = (): (() => void) | null => {
        const songVideo = document.querySelector<HTMLDivElement>('#song-video');
        const video = document.querySelector<HTMLVideoElement>('#song-video .html5-video-container > video');
        const wrapper = document.querySelector('#song-video > .player-wrapper');

        if (!songVideo || !video || !wrapper) return null;

        const blurCanvas = document.createElement('canvas');
        blurCanvas.classList.add('html5-blur-canvas');

        const context = blurCanvas.getContext('2d', { willReadFrequently: true });

        /* effect */
        let lastEffectWorkId: number | null = null;
        let lastImageData: ImageData | null = null;

        const onSync = () => {
          if (typeof lastEffectWorkId === 'number')
            cancelAnimationFrame(lastEffectWorkId);

          lastEffectWorkId = requestAnimationFrame(() => {
            if (!context) return;

            const width = this.qualityRatio;
            let height = Math.max(Math.floor((blurCanvas.height / blurCanvas.width) * width), 1,);
            if (!Number.isFinite(height)) height = width;
            if (!height) return;

            context.globalAlpha = 1;
            if (lastImageData) {
              const frameOffset = (1 / this.buffer) * (1000 / this.interpolationTime);
              context.globalAlpha = 1 - (frameOffset * 2); // because of alpha value must be < 1
              context.putImageData(lastImageData, 0, 0);
              context.globalAlpha = frameOffset;
            }
            context.drawImage(video, 0, 0, width, height);

            lastImageData = context.getImageData(0, 0, width, height); // current image data

            lastEffectWorkId = null;
          });
        };

        const applyVideoAttributes = () => {
          const rect = video.getBoundingClientRect();

          const newWidth = Math.floor(video.width || rect.width);
          const newHeight = Math.floor(video.height || rect.height);

          if (newWidth === 0 || newHeight === 0) return;

          blurCanvas.width = this.qualityRatio;
          blurCanvas.height = Math.floor((newHeight / newWidth) * this.qualityRatio);

          if (this.isFullscreen) blurCanvas.classList.add('fullscreen');
          else blurCanvas.classList.remove('fullscreen');

          blurCanvas.style.setProperty('--width', `${this.size}%`);
          blurCanvas.style.setProperty('--height', `${this.size}%`);
          blurCanvas.style.setProperty('--blur', `${this.blur}px`);
          blurCanvas.style.setProperty('--opacity', `${this.opacity}`);
        };

        this.update = applyVideoAttributes;

        applyVideoAttributes();

        /* hooking */
        let canvasInterval: NodeJS.Timeout | null = null;
        canvasInterval = setInterval(onSync, Math.max(1, Math.ceil(1000 / this.buffer)));

        const onPause = () => {
          if (canvasInterval) clearInterval(canvasInterval);
          canvasInterval = null;
        };
        const onPlay = () => {
          if (canvasInterval) clearInterval(canvasInterval);
          canvasInterval = setInterval(onSync, Math.max(1, Math.ceil(1000 / this.buffer)));
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

          if (blurCanvas.isConnected) blurCanvas.remove();
        };
      };

      const isVideoMode = () => {
        const songVideo = document.querySelector<HTMLDivElement>('#song-video');
        if (!songVideo) {
          return false;
        }

        return getComputedStyle(songVideo).display !== 'none';
      };

      const playerPage = document.querySelector<HTMLElement>('#player-page');
      const ytmusicAppLayout = document.querySelector<HTMLElement>('#layout');

      const isPageOpen = ytmusicAppLayout?.hasAttribute('player-page-open');
      if (isPageOpen) {
        this.unregister?.();
        this.unregister = (isVideoMode() ? injectBlurVideo() : injectBlurImage()) ?? null;
      }

      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'attributes') {
            const isPageOpen = ytmusicAppLayout?.hasAttribute('player-page-open');
            if (isPageOpen) {
              this.unregister?.();
              this.unregister = (isVideoMode() ? injectBlurVideo() : injectBlurImage()) ?? null;
            } else {
              this.unregister?.();
              this.unregister = null;
            }
          }
        }
      });

      if (playerPage) {
        observer.observe(playerPage, { attributes: true });
      }
    },
    onConfigChange(newConfig) {
      this.interpolationTime = newConfig.interpolationTime;
      this.buffer = newConfig.buffer;
      this.qualityRatio = newConfig.quality;
      this.size = newConfig.size;
      this.blur = newConfig.blur;
      this.opacity = newConfig.opacity;
      this.isFullscreen = newConfig.fullscreen;

      this.update?.();
    },
    stop() {
      this.observer?.disconnect();
      this.update = null;
      this.unregister?.();
    },
  },
});
