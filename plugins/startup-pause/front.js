module.exports = () => {
  let isInitialPause = false;

  document.addEventListener('apiLoaded', apiEvent => {
    const player = apiEvent.detail;

    const handleVideoDataChange = name => {
      if (name === 'dataloaded') {
        if (!isInitialPause) {
          isInitialPause = true;
          player.pauseVideo();
        }
      }
    };

    player.addEventListener('videodatachange', handleVideoDataChange);
  }, { once: true, passive: true });

  document.addEventListener('yt-previous-navigation', () => {
    isInitialPause = false;
  });
};
