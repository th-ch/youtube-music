module.exports = () => {
  document.addEventListener('apiLoaded', (apiEvent) => {
    apiEvent.detail.addEventListener('videodatachange', (name) => {
      if (name === 'dataloaded') {
        apiEvent.detail.pauseVideo();
        document.querySelector('video').addEventListener('timeupdate', (e) => {
          e.target.pause();
        });
      } else {
        document.querySelector('video').ontimeupdate = null;
      }
    });
  }, { once: true, passive: true });
};
