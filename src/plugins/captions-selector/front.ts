import configProvider from './config-renderer';

import CaptionsSettingsButtonHTML from './templates/captions-settings-template.html?raw';

import { ElementFromHtml } from '../utils-renderer';
import { YoutubePlayer } from '../../types/youtube-player';

import type { ConfigType } from '../../config/dynamic';

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

let captionsSelectorConfig: ConfigType<'captions-selector'>;

const $ = <Element extends HTMLElement>(selector: string): Element => document.querySelector(selector)!;

const captionsSettingsButton = ElementFromHtml(CaptionsSettingsButtonHTML);

export default () => {
  captionsSelectorConfig = configProvider.getAll();

  configProvider.subscribeAll((newConfig) => {
    captionsSelectorConfig = newConfig;
  });
  document.addEventListener('apiLoaded', (event) => setup(event.detail), { once: true, passive: true });
};

function setup(api: YoutubePlayer) {
  $('.right-controls-buttons').append(captionsSettingsButton);

  let captionTrackList = api.getOption<LanguageOptions[]>('captions', 'tracklist') ?? [];

  $('video').addEventListener('srcChanged', () => {
    if (captionsSelectorConfig.disableCaptions) {
      setTimeout(() => api.unloadModule('captions'), 100);
      captionsSettingsButton.style.display = 'none';
      return;
    }

    api.loadModule('captions');

    setTimeout(() => {
      captionTrackList = api.getOption('captions', 'tracklist') ?? [];

      if (captionsSelectorConfig.autoload && captionsSelectorConfig.lastCaptionsCode) {
        api.setOption('captions', 'track', {
          languageCode: captionsSelectorConfig.lastCaptionsCode,
        });
      }

      captionsSettingsButton.style.display = captionTrackList?.length
        ? 'inline-block'
        : 'none';
    }, 250);
  });

  captionsSettingsButton.addEventListener('click', async () => {
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
      configProvider.set('lastCaptionsCode', newCaptions?.languageCode);
      if (newCaptions) {
        api.setOption('captions', 'track', { languageCode: newCaptions.languageCode });
      } else {
        api.setOption('captions', 'track', {});
      }

      setTimeout(() => api.playVideo());
    }
  });
}
