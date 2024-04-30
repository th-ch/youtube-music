import { ElementFromHtml } from '@/plugins/utils/renderer';
import { createRenderer } from '@/utils';

import CaptionsSettingsButtonHTML from './templates/captions-settings-template.html?raw';

import { YoutubePlayer } from '@/types/youtube-player';

export interface LanguageOptions {
  displayName: string;
  id: string | null;
  is_default: boolean;
  is_servable: boolean;
  is_translateable: boolean;
  kind: string;
  languageCode: string; // 2 length
  languageName: string;
  name: string | null;
  vss_id: string;
}

export interface CaptionsSelectorConfig {
  enabled: boolean;
  disableCaptions: boolean;
  autoload: boolean;
  lastCaptionsCode: string;
}

export default createRenderer<
  {
    captionsSettingsButton: HTMLElement;
    captionTrackList: LanguageOptions[] | null;
    api: YoutubePlayer | null;
    config: CaptionsSelectorConfig | null;
    setConfig: (config: Partial<CaptionsSelectorConfig>) => void;
    videoChangeListener: () => void;
    captionsButtonClickListener: () => void;
  },
  CaptionsSelectorConfig
>({
  captionsSettingsButton: ElementFromHtml(CaptionsSettingsButtonHTML),
  captionTrackList: null,
  api: null,
  config: null,
  setConfig: () => {},
  async captionsButtonClickListener() {
    if (this.captionTrackList?.length) {
      const currentCaptionTrack = this.api!.getOption<LanguageOptions>(
        'captions',
        'track',
      );
      let currentIndex = currentCaptionTrack
        ? this.captionTrackList.indexOf(
            this.captionTrackList.find(
              (track) =>
                track.languageCode === currentCaptionTrack.languageCode,
            )!,
          )
        : null;

      const captionLabels = [
        ...this.captionTrackList.map((track) => track.displayName),
        'None',
      ];

      currentIndex = (await window.ipcRenderer.invoke(
        'captionsSelector',
        captionLabels,
        currentIndex,
      )) as number;
      if (currentIndex === null) {
        return;
      }

      const newCaptions = this.captionTrackList[currentIndex];
      this.setConfig({ lastCaptionsCode: newCaptions?.languageCode });
      if (newCaptions) {
        this.api?.setOption('captions', 'track', {
          languageCode: newCaptions.languageCode,
        });
      } else {
        this.api?.setOption('captions', 'track', {});
      }

      setTimeout(() => this.api?.playVideo());
    }
  },
  videoChangeListener() {
    if (this.config?.disableCaptions) {
      setTimeout(() => this.api!.unloadModule('captions'), 100);
      this.captionsSettingsButton.style.display = 'none';
      return;
    }

    this.api!.loadModule('captions');

    setTimeout(() => {
      this.captionTrackList =
        this.api!.getOption('captions', 'tracklist') ?? [];

      if (this.config!.autoload && this.config!.lastCaptionsCode) {
        this.api?.setOption('captions', 'track', {
          languageCode: this.config!.lastCaptionsCode,
        });
      }

      this.captionsSettingsButton.style.display = this.captionTrackList?.length
        ? 'inline-block'
        : 'none';
    }, 250);
  },
  async start({ getConfig, setConfig }) {
    this.config = await getConfig();
    this.setConfig = setConfig;
  },
  stop() {
    document
      .querySelector('.right-controls-buttons')
      ?.removeChild(this.captionsSettingsButton);
    document
      .querySelector<YoutubePlayer & HTMLElement>('#movie_player')
      ?.unloadModule('captions');
    document
      .querySelector('video')
      ?.removeEventListener('ytmd:src-changed', this.videoChangeListener);
    this.captionsSettingsButton.removeEventListener(
      'click',
      this.captionsButtonClickListener,
    );
  },
  onPlayerApiReady(playerApi) {
    this.api = playerApi;

    document
      .querySelector('.right-controls-buttons')
      ?.append(this.captionsSettingsButton);

    this.captionTrackList =
      this.api.getOption<LanguageOptions[]>('captions', 'tracklist') ?? [];

    document
      .querySelector('video')
      ?.addEventListener('ytmd:src-changed', this.videoChangeListener);
    this.captionsSettingsButton.addEventListener(
      'click',
      this.captionsButtonClickListener,
    );
  },
  onConfigChange(newConfig) {
    this.config = newConfig;
  },
});
