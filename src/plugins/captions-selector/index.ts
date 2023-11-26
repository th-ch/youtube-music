import prompt from 'custom-electron-prompt';

import promptOptions from '@/providers/prompt-options';
import { createPlugin } from '@/utils';
import { ElementFromHtml } from '@/plugins/utils/renderer';

import CaptionsSettingsButtonHTML from './templates/captions-settings-template.html?raw';

import { YoutubePlayer } from '@/types/youtube-player';

interface LanguageOptions {
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

interface CaptionsSelectorConfig {
  enabled: boolean;
  disableCaptions: boolean;
  autoload: boolean;
  lastCaptionsCode: string;
}

const captionsSettingsButton = ElementFromHtml(CaptionsSettingsButtonHTML);

export default createPlugin<
  unknown,
  unknown,
  {
    captionTrackList: LanguageOptions[] | null;
    api: YoutubePlayer | null;
    config: CaptionsSelectorConfig | null;
    setConfig: ((config: Partial<CaptionsSelectorConfig>) => void);
    videoChangeListener: (() => void);
    captionsButtonClickListener: (() => void);
  },
  CaptionsSelectorConfig
>({
  name: 'Captions Selector',
  config: {
    enabled: false,
    disableCaptions: false,
    autoload: false,
    lastCaptionsCode: '',
  },

  async menu({ getConfig, setConfig }) {
    const config = await getConfig();
    return [
      {
        label: 'Automatically select last used caption',
        type: 'checkbox',
        checked: config.autoload as boolean,
        click(item) {
          setConfig({ autoload: item.checked });
        },
      },
      {
        label: 'No captions by default',
        type: 'checkbox',
        checked: config.disableCaptions as boolean,
        click(item) {
          setConfig({ disableCaptions: item.checked });
        },
      },
    ];
  },

  backend: {
    start({ ipc: { handle }, window }) {
      handle(
        'captionsSelector',
        async (captionLabels: Record<string, string>, currentIndex: string) =>
          await prompt(
            {
              title: 'Choose Caption',
              label: `Current Caption: ${captionLabels[currentIndex] || 'None'}`,
              type: 'select',
              value: currentIndex,
              selectOptions: captionLabels,
              resizable: true,
              ...promptOptions(),
            },
            window,
          ),
      );
    },
    stop({ ipc: { removeHandler } }) {
      removeHandler('captionsSelector');
    }
  },

  renderer: {
    captionTrackList: null,
    api: null,
    config: null,
    setConfig: () => {},
    async videoChangeListener() {
      if (this.captionTrackList?.length) {
        const currentCaptionTrack = this.api!.getOption<LanguageOptions>('captions', 'track');
        let currentIndex = currentCaptionTrack
          ? this.captionTrackList.indexOf(this.captionTrackList.find((track) => track.languageCode === currentCaptionTrack.languageCode)!)
          : null;

        const captionLabels = [
          ...this.captionTrackList.map((track) => track.displayName),
          'None',
        ];

        currentIndex = await window.ipcRenderer.invoke('captionsSelector', captionLabels, currentIndex) as number;
        if (currentIndex === null) {
          return;
        }

        const newCaptions = this.captionTrackList[currentIndex];
        this.setConfig({ lastCaptionsCode: newCaptions?.languageCode });
        if (newCaptions) {
          this.api?.setOption('captions', 'track', { languageCode: newCaptions.languageCode });
        } else {
          this.api?.setOption('captions', 'track', {});
        }

        setTimeout(() => this.api?.playVideo());
      }
    },
    captionsButtonClickListener() {
      if (this.config!.disableCaptions) {
        setTimeout(() => this.api!.unloadModule('captions'), 100);
        captionsSettingsButton.style.display = 'none';
        return;
      }

      this.api!.loadModule('captions');

      setTimeout(() => {
        this.captionTrackList = this.api!.getOption('captions', 'tracklist') ?? [];

        if (this.config!.autoload && this.config!.lastCaptionsCode) {
          this.api?.setOption('captions', 'track', {
            languageCode: this.config!.lastCaptionsCode,
          });
        }

        captionsSettingsButton.style.display = this.captionTrackList?.length
          ? 'inline-block'
          : 'none';
      }, 250);
    },
    async start({ getConfig, setConfig }) {
      this.config = await getConfig();
      this.setConfig = setConfig;
    },
    stop() {
      document.querySelector('.right-controls-buttons')?.removeChild(captionsSettingsButton);
      document.querySelector<YoutubePlayer & HTMLElement>('#movie_player')?.unloadModule('captions');
      document.querySelector('video')?.removeEventListener('srcChanged', this.videoChangeListener);
      captionsSettingsButton.removeEventListener('click', this.captionsButtonClickListener);
    },
    onPlayerApiReady(playerApi) {
      this.api = playerApi;

      document.querySelector('.right-controls-buttons')?.append(captionsSettingsButton);

      this.captionTrackList = this.api.getOption<LanguageOptions[]>('captions', 'tracklist') ?? [];

      document.querySelector('video')?.addEventListener('srcChanged', this.videoChangeListener);
      captionsSettingsButton.addEventListener('click', this.captionsButtonClickListener);
    },
    onConfigChange(newConfig) {
      this.config = newConfig;
    },
  },
});
