import { createPlugin } from '@/utils';
import {YoutubePlayer} from "@/types/youtube-player";

export type DisableAutoPlayPluginConfig = {
  enabled: boolean;
  applyOnce: boolean;
}

export default createPlugin<
  unknown,
  unknown,
  {
    config: DisableAutoPlayPluginConfig | null;
    api: YoutubePlayer | null;
    eventListener: (name: string) => void;
    timeUpdateListener: (e: Event) => void;
  },
  DisableAutoPlayPluginConfig
>({
  name: 'Disable Autoplay',
  restartNeeded: false,
  config: {
    enabled: false,
    applyOnce: false,
  },
  menu: async ({ getConfig, setConfig }) => {
    const config = await getConfig();

    return [
      {
        label: 'Applies only on startup',
        type: 'checkbox',
        checked: config.applyOnce,
        async click() {
          const nowConfig = await getConfig();
          setConfig({
            applyOnce: !nowConfig.applyOnce,
          });
        },
      },
    ];
  },
  renderer: {
    config: null,
    api: null,
    eventListener(name: string) {
      if (this.config?.applyOnce) {
        this.api?.removeEventListener('videodatachange', this.eventListener);
      }

      if (name === 'dataloaded') {
        this.api?.pauseVideo();
        document.querySelector<HTMLVideoElement>('video')?.addEventListener('timeupdate', this.timeUpdateListener, { once: true });
      }
    },
    timeUpdateListener(e: Event) {
      if (e.target instanceof HTMLVideoElement) {
        e.target.pause();
      }
    },
    onPlayerApiReady(api) {
      this.api = api;

      api.addEventListener('videodatachange', this.eventListener);
    },
    stop() {
      this.api?.removeEventListener('videodatachange', this.eventListener);
    },
    onConfigChange(newConfig) {
      this.config = newConfig;
    }
  }
});

