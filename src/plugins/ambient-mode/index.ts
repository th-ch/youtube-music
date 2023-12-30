import style from './style.css?inline';

import { createPlugin } from '@/utils';
import { t } from '@/i18n';

export type AmbientModePluginConfig = {
  enabled: boolean;
  quality: number;
  buffer: number;
  interpolationTime: number;
  blur: number;
  size: number;
  opacity: number;
  fullscreen: boolean;
};
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
  menu: async ({ getConfig, setConfig }) => {
    const interpolationTimeList = [0, 500, 1000, 1500, 2000, 3000, 4000, 5000];
    const qualityList = [10, 25, 50, 100, 200, 500, 1000];
    const sizeList = [100, 110, 125, 150, 175, 200, 300];
    const bufferList = [1, 5, 10, 20, 30];
    const blurAmountList = [0, 5, 10, 25, 50, 100, 150, 200, 500];
    const opacityList = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

    const config = await getConfig();

    return [
      {
        label: t('plugins.ambient-mode.menu.smoothness-transition.label'),
        submenu: interpolationTimeList.map((interpolationTime) => ({
          label: t(
            'plugins.ambient-mode.menu.smoothness-transition.submenu.during',
            {
              interpolationTime: interpolationTime / 1000,
            },
          ),
          type: 'radio',
          checked: config.interpolationTime === interpolationTime,
          click() {
            setConfig({ interpolationTime });
          },
        })),
      },
      {
        label: t('plugins.ambient-mode.menu.quality.label'),
        submenu: qualityList.map((quality) => ({
          label: t('plugins.ambient-mode.menu.quality.submenu.pixels', {
            quality,
          }),
          type: 'radio',
          checked: config.quality === quality,
          click() {
            setConfig({ quality });
          },
        })),
      },
      {
        label: t('plugins.ambient-mode.menu.size.label'),
        submenu: sizeList.map((size) => ({
          label: t('plugins.ambient-mode.menu.size.submenu.percent', { size }),
          type: 'radio',
          checked: config.size === size,
          click() {
            setConfig({ size });
          },
        })),
      },
      {
        label: t('plugins.ambient-mode.menu.buffer.label'),
        submenu: bufferList.map((buffer) => ({
          label: t('plugins.ambient-mode.menu.buffer.submenu.buffer', {
            buffer,
          }),
          type: 'radio',
          checked: config.buffer === buffer,
          click() {
            setConfig({ buffer });
          },
        })),
      },
      {
        label: t('plugins.ambient-mode.menu.opacity.label'),
        submenu: opacityList.map((opacity) => ({
          label: t('plugins.ambient-mode.menu.opacity.submenu.percent', {
            opacity: opacity * 100,
          }),
          type: 'radio',
          checked: config.opacity === opacity,
          click() {
            setConfig({ opacity });
          },
        })),
      },
      {
        label: t('plugins.ambient-mode.menu.blur-amount.label'),
        submenu: blurAmountList.map((blur) => ({
          label: t('plugins.ambient-mode.menu.blur-amount.submenu.pixels', {
            blurAmount: blur,
          }),
          type: 'radio',
          checked: config.blur === blur,
          click() {
            setConfig({ blur });
          },
        })),
      },
      {
        label: t('plugins.ambient-mode.menu.use-fullscreen.label'),
        type: 'checkbox',
        checked: config.fullscreen,
        click(item) {
          setConfig({ fullscreen: item.checked });
        },
      },
    ];
  },

  renderer: {
    interpolationTime: defaultConfig.interpolationTime,
    buffer: defaultConfig.buffer,
    qualityRatio: defaultConfig.quality,
    sizeRatio: defaultConfig.size / 100,
    blur: defaultConfig.blur,
    opacity: defaultConfig.opacity,
    isFullscreen: defaultConfig.fullscreen,

    unregister: null as (() => void) | null,
    update: null as (() => void) | null,
    observer: null as MutationObserver | null,

    start() {
      const injectBlurImage = () => {
        const songImage = document.querySelector<HTMLImageElement>(
          '#song-image',
        );
        const image = document.querySelector<HTMLImageElement>(
          '#song-image yt-img-shadow > img',
        );

        if (!songImage) return null;
        if (!image) return null;

        const blurImage = document.createElement('img');
        blurImage.classList.add('html5-blur-image');
        blurImage.src = image.src;

        const applyImageAttribute = () => {
          const rect = image.getBoundingClientRect();

          const newWidth = Math.floor(image.width || rect.width);
          const newHeight = Math.floor(image.height || rect.height);

          if (newWidth === 0 || newHeight === 0) return;

          if (this.isFullscreen) blurImage.classList.add('fullscreen');
          else blurImage.classList.remove('fullscreen');

          const leftOffset = (newWidth * (this.sizeRatio - 1)) / 2;
          const topOffset = (newHeight * (this.sizeRatio - 1)) / 2;
          blurImage.style.setProperty('--left', `${-1 * leftOffset}px`);
          blurImage.style.setProperty('--top', `${-1 * topOffset}px`);
          blurImage.style.setProperty('--width', `${newWidth * this.sizeRatio}px`);
          blurImage.style.setProperty('--height', `${newHeight * this.sizeRatio}px`);
          blurImage.style.setProperty('--blur', `${this.blur}px`);
          blurImage.style.setProperty('--opacity', `${this.opacity}`);
        };

        this.update = applyImageAttribute;

        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes') {
              applyImageAttribute();
            }
          });
        });
        const resizeObserver = new ResizeObserver(() => {
          applyImageAttribute();
        });

        applyImageAttribute();
        observer.observe(songImage, { attributes: true });
        resizeObserver.observe(songImage);
        window.addEventListener('resize', applyImageAttribute);

        /* injecting */
        songImage.prepend(blurImage);

        /* cleanup */
        return () => {
          observer.disconnect();
          resizeObserver.disconnect();
          window.removeEventListener('resize', applyImageAttribute);

          if (blurImage.isConnected) blurImage.remove();
        };
      };

      const injectBlurVideo = (): (() => void) | null => {
        const songVideo = document.querySelector<HTMLDivElement>('#song-video');
        const video = document.querySelector<HTMLVideoElement>(
          '#song-video .html5-video-container > video',
        );
        const wrapper = document.querySelector('#song-video > .player-wrapper');

        if (!songVideo) return null;
        if (!video) return null;
        if (!wrapper) return null;

        const blurCanvas = document.createElement('canvas');
        blurCanvas.classList.add('html5-blur-canvas');

        const context = blurCanvas.getContext('2d', {
          willReadFrequently: true,
        });

        /* effect */
        let lastEffectWorkId: number | null = null;
        let lastImageData: ImageData | null = null;

        const onSync = () => {
          if (typeof lastEffectWorkId === 'number')
            cancelAnimationFrame(lastEffectWorkId);

          lastEffectWorkId = requestAnimationFrame(() => {
            if (!context) return;

            const width = this.qualityRatio;
            let height = Math.max(
              Math.floor((blurCanvas.height / blurCanvas.width) * width),
              1,
            );
            if (!Number.isFinite(height)) height = width;
            if (!height) return;

            context.globalAlpha = 1;
            if (lastImageData) {
              const frameOffset =
                (1 / this.buffer) * (1000 / this.interpolationTime);
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
          blurCanvas.height = Math.floor(
            (newHeight / newWidth) * this.qualityRatio,
          );
          blurCanvas.style.width = `${newWidth * this.sizeRatio}px`;
          blurCanvas.style.height = `${newHeight * this.sizeRatio}px`;

          if (this.isFullscreen) blurCanvas.classList.add('fullscreen');
          else blurCanvas.classList.remove('fullscreen');

          const leftOffset = (newWidth * (this.sizeRatio - 1)) / 2;
          const topOffset = (newHeight * (this.sizeRatio - 1)) / 2;
          blurCanvas.style.setProperty('--left', `${-1 * leftOffset}px`);
          blurCanvas.style.setProperty('--top', `${-1 * topOffset}px`);
          blurCanvas.style.setProperty('--blur', `${this.blur}px`);
          blurCanvas.style.setProperty('--opacity', `${this.opacity}`);
        };
        this.update = applyVideoAttributes;

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
        canvasInterval = setInterval(
          onSync,
          Math.max(1, Math.ceil(1000 / this.buffer)),
        );
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
          canvasInterval = setInterval(
            onSync,
            Math.max(1, Math.ceil(1000 / this.buffer)),
          );
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

          if (blurCanvas.isConnected) blurCanvas.remove();
        };
      };

      const isVideoMode = () => {
        const songVideo = document.querySelector<HTMLDivElement>('#song-video');
        if (!songVideo) return false;

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
            const isPageOpen =
              ytmusicAppLayout?.hasAttribute('player-page-open');
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
      this.sizeRatio = newConfig.size / 100;
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
