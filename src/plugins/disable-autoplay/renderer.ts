import builder from './index';

import type { YoutubePlayer } from '../../types/youtube-player';

export default builder.createRenderer(({ getConfig }) => {
  let config: Awaited<ReturnType<typeof getConfig>>;

  let apiEvent: CustomEvent<YoutubePlayer>;

  const timeUpdateListener = (e: Event) => {
    if (e.target instanceof HTMLVideoElement) {
      e.target.pause();
    }
  };

  const eventListener = async (name: string) => {
    if (config.applyOnce) {
      apiEvent.detail.removeEventListener('videodatachange', eventListener);
    }

    if (name === 'dataloaded') {
      apiEvent.detail.pauseVideo();
      document.querySelector<HTMLVideoElement>('video')?.addEventListener('timeupdate', timeUpdateListener, { once: true });
    }
  };

  return {
    async onLoad() {
      config = await getConfig();

      document.addEventListener('apiLoaded', (api) => {
        apiEvent = api;

        apiEvent.detail.addEventListener('videodatachange', eventListener);
      }, { once: true, passive: true });
    },
    onUnload() {
      apiEvent.detail.removeEventListener('videodatachange', eventListener);
    },
    onConfigChange(newConfig) {
      config = newConfig;
    }
  };
});
