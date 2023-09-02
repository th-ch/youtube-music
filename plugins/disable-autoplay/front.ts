export default () => {
  document.addEventListener('apiLoaded', (apiEvent) => {
    apiEvent.detail.addEventListener('videodatachange', (name: string) => {
      if (name === 'dataloaded') {
        apiEvent.detail.pauseVideo();
        (document.querySelector('video') as HTMLVideoElement)?.addEventListener('timeupdate', (e) => {
          (e.target as HTMLVideoElement)?.pause();
        });
      } else {
        (document.querySelector('video') as HTMLVideoElement).ontimeupdate = null;
      }
    });
  }, { once: true, passive: true });
};
