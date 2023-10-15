/* eslint-disable @typescript-eslint/await-thenable */
/* renderer */

import { ipcRenderer } from 'electron';

import configProvider from './config';

import CaptionsSettingsButtonHTML from './templates/captions-settings-template.html';

import { ElementFromHtml } from '../utils';
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

let config: ConfigType<'captions-selector'>;

const $ = <Element extends HTMLElement>(selector: string): Element => document.querySelector(selector)!;

const captionsSettingsButton = ElementFromHtml(CaptionsSettingsButtonHTML);

export default async () => {
  // RENDERER
  config = await configProvider.getAll();

  configProvider.subscribeAll((newConfig) => {
    config = newConfig;
  });
  document.addEventListener('apiLoaded', (event) => setup(event.detail), { once: true, passive: true });
};

function setup(api: YoutubePlayer) {
  $('.right-controls-buttons').append(captionsSettingsButton);

  let captionTrackList = api.getOption<LanguageOptions[]>('captions', 'tracklist') ?? [];

  $('video').addEventListener('srcChanged', () => {
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

      currentIndex = await ipcRenderer.invoke('captionsSelector', captionLabels, currentIndex) as number;
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
