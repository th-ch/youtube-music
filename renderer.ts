import setupSongInfo from './providers/song-info-front';
import { setupSongControls } from './providers/song-controls-front';
import { startingPages } from './providers/extracted-data';

import albumColorThemeRenderer from './plugins/album-color-theme/front';
import ambientModeRenderer from './plugins/ambient-mode/front';
import audioCompressorRenderer from './plugins/audio-compressor/front';
import bypassAgeRestrictionsRenderer from './plugins/bypass-age-restrictions/front';
import captionsSelectorRenderer from './plugins/captions-selector/front';
import compactSidebarRenderer from './plugins/compact-sidebar/front';
import crossfadeRenderer from './plugins/crossfade/front';
import disableAutoplayRenderer from './plugins/disable-autoplay/front';
import downloaderRenderer from './plugins/downloader/front';
import exponentialVolumeRenderer from './plugins/exponential-volume/front';
import inAppMenuRenderer from './plugins/in-app-menu/front';
import lyricsGeniusRenderer from './plugins/lyrics-genius/front';
import navigationRenderer from './plugins/navigation/front';
import noGoogleLogin from './plugins/no-google-login/front';
import pictureInPictureRenderer from './plugins/picture-in-picture/front';
import playbackSpeedRenderer from './plugins/playback-speed/front';
import preciseVolumeRenderer from './plugins/precise-volume/front';
import qualityChangerRenderer from './plugins/quality-changer/front';
import skipSilencesRenderer from './plugins/skip-silences/front';
import sponsorblockRenderer from './plugins/sponsorblock/front';
import videoToggleRenderer from './plugins/video-toggle/front';
import visualizerRenderer from './plugins/visualizer/front';

import type { PluginMapper } from './preload';

const rendererPlugins: PluginMapper<'renderer'> = {
  'album-color-theme': albumColorThemeRenderer,
  'ambient-mode': ambientModeRenderer,
  'audio-compressor': audioCompressorRenderer,
  'bypass-age-restrictions': bypassAgeRestrictionsRenderer,
  'captions-selector': captionsSelectorRenderer,
  'compact-sidebar': compactSidebarRenderer,
  'crossfade': crossfadeRenderer,
  'disable-autoplay': disableAutoplayRenderer,
  'downloader': downloaderRenderer,
  'exponential-volume': exponentialVolumeRenderer,
  'in-app-menu': inAppMenuRenderer,
  'lyrics-genius': lyricsGeniusRenderer,
  'navigation': navigationRenderer,
  'no-google-login': noGoogleLogin,
  'picture-in-picture': pictureInPictureRenderer,
  'playback-speed': playbackSpeedRenderer,
  'precise-volume': preciseVolumeRenderer,
  'quality-changer': qualityChangerRenderer,
  'skip-silences': skipSilencesRenderer,
  'sponsorblock': sponsorblockRenderer,
  'video-toggle': videoToggleRenderer,
  'visualizer': visualizerRenderer,
};

const enabledPluginNameAndOptions = window.mainConfig.plugins.getEnabled();

let api: Element | null = null;

function listenForApiLoad() {
  api = document.querySelector('#movie_player');
  if (api) {
    onApiLoaded();
    return;
  }

  const observer = new MutationObserver(() => {
    api = document.querySelector('#movie_player');
    if (api) {
      observer.disconnect();
      onApiLoaded();
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

interface YouTubeMusicAppElement extends HTMLElement {
  navigate_(page: string): void;
}

function onApiLoaded() {
  const video = document.querySelector('video')!;
  const audioContext = new AudioContext();
  const audioSource = audioContext.createMediaElementSource(video);
  audioSource.connect(audioContext.destination);

  video.addEventListener(
    'loadstart',
    () => {
      // Emit "audioCanPlay" for each video
      video.addEventListener(
        'canplaythrough',
        () => {
          document.dispatchEvent(
            new CustomEvent('audioCanPlay', {
              detail: {
                audioContext,
                audioSource,
              },
            }),
          );
        },
        { once: true },
      );
    },
    { passive: true },
  );!

  document.dispatchEvent(new CustomEvent('apiLoaded', { detail: api }));
  window.ipcRenderer.send('apiLoaded');

  // Navigate to "Starting page"
  const startingPage: string = window.mainConfig.get('options.startingPage');
  if (startingPage && startingPages[startingPage]) {
    document.querySelector<YouTubeMusicAppElement>('ytmusic-app')?.navigate_(startingPages[startingPage]);
  }

  // Remove upgrade button
  if (window.mainConfig.get('options.removeUpgradeButton')) {
    const styles = document.createElement('style');
    styles.innerHTML = `ytmusic-guide-section-renderer #items ytmusic-guide-entry-renderer:last-child {
      display: none;
    }`;
    document.head.appendChild(styles);
  }

  // Hide / Force show like buttons
  const likeButtonsOptions: string = window.mainConfig.get('options.likeButtons');
  if (likeButtonsOptions) {
    const likeButtons: HTMLElement | null = document.querySelector('ytmusic-like-button-renderer');
    if (likeButtons) {
      likeButtons.style.display
        = {
        hide: 'none',
        force: 'inherit',
      }[likeButtonsOptions] || '';
    }
  }
}

(() => {
  enabledPluginNameAndOptions.forEach(async ([pluginName, options]) => {
    if (Object.hasOwn(rendererPlugins, pluginName)) {
      const handler = rendererPlugins[pluginName];
      try {
        await handler?.(options as never);
      } catch (error) {
        console.error(`Error in plugin "${pluginName}": ${String(error)}`);
      }
    }
  });

  // Wait for complete load of YouTube api
  listenForApiLoad();

  // Inject song-info provider
  setupSongInfo();

  // Inject song-controls
  setupSongControls();

  // Blocks the "Are You Still There?" popup by setting the last active time to Date.now every 15min
  setInterval(() => window._lact = Date.now(), 900_000);

  // Setup back to front logger
  if (window.electronIs.dev()) {
    window.ipcRenderer.on('log', (_event, log: string) => {
      console.log(JSON.parse(log));
    });
  }
})();
