import { ConfigType } from '../../config/dynamic';

export default (_: ConfigType<'ambient-mode'>) => {
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

    const context = blurCanvas.getContext('2d');

    const applyVideoAttributes = () => {
      const rect = video.getBoundingClientRect();

      blurCanvas.width = video.width || rect.width;
      blurCanvas.height = video.height || rect.height;
    };

    const onSync = () => {
      requestAnimationFrame(() => {
        context?.drawImage(video, 0, 0, blurCanvas.width, blurCanvas.height);
      });
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
    video.addEventListener('timeupdate', onSync);

    applyVideoAttributes();
    observer.observe(songVideo, { attributes: true });
    resizeObserver.observe(songVideo);

    /* injecting */
    wrapper.prepend(blurCanvas);

    /* cleanup */
    return () => {
      video.removeEventListener('timeupdate', onSync);
      observer.disconnect();
      resizeObserver.disconnect();

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
        }
      }
    }
  });

  if (playerPage) {
    observer.observe(playerPage, { attributes: true });
  }
};