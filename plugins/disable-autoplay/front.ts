export default () => {
  const timeUpdateListener = (e: Event) => {
    if (e.target instanceof HTMLVideoElement) {
      e.target.pause();
    }
  };

  document.addEventListener('apiLoaded', (apiEvent) => {
    apiEvent.detail.addEventListener('videodatachange', (name: string) => {
      if (name === 'dataloaded') {
        apiEvent.detail.pauseVideo();
        document.querySelector<HTMLVideoElement>('video')?.addEventListener('timeupdate', timeUpdateListener);
      } else {
        document.querySelector<HTMLVideoElement>('video')?.removeEventListener('timeupdate', timeUpdateListener);
      }
    });
  }, { once: true, passive: true });
};
