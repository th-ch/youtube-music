import builder from './index';

import type { YoutubePlayer } from '../../types/youtube-player';

export default builder.createRenderer(({ getConfig }) => {
  let config: Awaited<ReturnType<typeof getConfig>>;

  let apiEvent: YoutubePlayer;

  const timeUpdateListener = (e: Event) => {
    if (e.target instanceof HTMLVideoElement) {
      e.target.pause();
    }
  };

  const eventListener = async (name: string) => {
    if (config.applyOnce) {
      apiEvent.removeEventListener('videodatachange', eventListener);
    }

    if (name === 'dataloaded') {
      apiEvent.pauseVideo();
      document.querySelector<HTMLVideoElement>('video')?.addEventListener('timeupdate', timeUpdateListener, { once: true });
    }
  };

  return {
    async onPlayerApiReady(api) {
      config = await getConfig();

      apiEvent = api;

      apiEvent.addEventListener('videodatachange', eventListener);
    },
    onUnload() {
      apiEvent.removeEventListener('videodatachange', eventListener);
    },
    onConfigChange(newConfig) {
      config = newConfig;
    }
  };
});
