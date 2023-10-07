import type { ConfigType } from '../../config/dynamic';

export default (options: ConfigType<'disable-autoplay'>) => {
  const timeUpdateListener = (e: Event) => {
    if (e.target instanceof HTMLVideoElement) {
      e.target.pause();
    }
  };

  document.addEventListener('apiLoaded', (apiEvent) => {
    const eventListener = (name: string) => {
      if (options.applyOnce) {
        apiEvent.detail.removeEventListener('videodatachange', eventListener);
      }

      if (name === 'dataloaded') {
        apiEvent.detail.pauseVideo();
        document.querySelector<HTMLVideoElement>('video')?.addEventListener('timeupdate', timeUpdateListener, { once: true });
      }
    };
    apiEvent.detail.addEventListener('videodatachange', eventListener);
  }, { once: true, passive: true });
};
