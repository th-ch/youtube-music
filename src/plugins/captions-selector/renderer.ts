import CaptionsSettingsButtonHTML from './templates/captions-settings-template.html?raw';

import builder from './index';

import { ElementFromHtml } from '../utils/renderer';
import { YoutubePlayer } from '../../types/youtube-player';

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

const $ = <Element extends HTMLElement>(selector: string): Element => document.querySelector(selector)!;

const captionsSettingsButton = ElementFromHtml(CaptionsSettingsButtonHTML);

export default builder.createRenderer(({ getConfig, setConfig }) => {
  let config: Awaited<ReturnType<typeof getConfig>>;
  let captionTrackList: LanguageOptions[] | null = null;
  let api: YoutubePlayer;

  const videoChangeListener = () => {
    if (config.disableCaptions) {
      setTimeout(() => api.unloadModule('captions'), 100);
      captionsSettingsButton.style.display = 'none';
      return;
    }

    api.loadModule('captions');

    setTimeout(() => {
      captionTrackList = api.getOption('captions', 'tracklist') ?? [];

      if (config.autoload && config.lastCaptionsCode) {
        api.setOption('captions', 'track', {
          languageCode: config.lastCaptionsCode,
        });
      }

      captionsSettingsButton.style.display = captionTrackList?.length
        ? 'inline-block'
        : 'none';
    }, 250);
  };

  const captionsButtonClickListener = async () => {
    if (captionTrackList?.length) {
      const currentCaptionTrack = api.getOption<LanguageOptions>('captions', 'track')!;
      let currentIndex = currentCaptionTrack
        ? captionTrackList.indexOf(captionTrackList.find((track) => track.languageCode === currentCaptionTrack.languageCode)!)
        : null;

      const captionLabels = [
        ...captionTrackList.map((track) => track.displayName),
        'None',
      ];

      currentIndex = await window.ipcRenderer.invoke('captionsSelector', captionLabels, currentIndex) as number;
      if (currentIndex === null) {
        return;
      }

      const newCaptions = captionTrackList[currentIndex];
      setConfig({ lastCaptionsCode: newCaptions?.languageCode });
      if (newCaptions) {
        api.setOption('captions', 'track', { languageCode: newCaptions.languageCode });
      } else {
        api.setOption('captions', 'track', {});
      }

      setTimeout(() => api.playVideo());
    }
  };

  const removeListener = () => {
    $('.right-controls-buttons').removeChild(captionsSettingsButton);
    $<YoutubePlayer & HTMLElement>('#movie_player').unloadModule('captions');
  };

  return {
    async onLoad() {
      config = await getConfig();
    },
    onPlayerApiReady(playerApi) {
      api = playerApi;

      $('.right-controls-buttons').append(captionsSettingsButton);

      captionTrackList = api.getOption<LanguageOptions[]>('captions', 'tracklist') ?? [];

      $('video').addEventListener('srcChanged', videoChangeListener);
      captionsSettingsButton.addEventListener('click', captionsButtonClickListener);
    },
    onUnload() {
      removeListener();
    },
    onConfigChange(newConfig) {
      config = newConfig;
    }
  };
});
