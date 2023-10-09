import { ipcRenderer } from 'electron';
import is from 'electron-is';

import config from './config';
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

import adblockerPreload from './plugins/adblocker/preload';
import preciseVolumePreload from './plugins/precise-volume/preload';

import type { ConfigType, OneOfDefaultConfigKey } from './config/dynamic';

type PluginMapper<Type extends 'renderer' | 'preload' | 'backend'> = {
  [Key in OneOfDefaultConfigKey]?: (
    Type extends 'renderer' ? (options: ConfigType<Key>) => (Promise<void> | void) :
      Type extends 'preload' ? () => (Promise<void> | void) :
    never
  )
};

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

const preloadPlugins: PluginMapper<'preload'> = {
  'adblocker': adblockerPreload,
  'precise-volume': preciseVolumePreload,
};

const enabledPluginNameAndOptions = config.plugins.getEnabled();

const $ = document.querySelector.bind(document);

let api: Element | null = null;

enabledPluginNameAndOptions.forEach(async ([plugin, options]) => {
  if (Object.hasOwn(preloadPlugins, plugin)) {
    const handler = preloadPlugins[plugin];
    try {
      await handler?.();
    } catch (error) {
      console.error(`Error in plugin "${plugin}": ${String(error)}`);
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
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

  // Add action for reloading
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
  (global as any).reload = () => ipcRenderer.send('reload');

  // Blocks the "Are You Still There?" popup by setting the last active time to Date.now every 15min
  setInterval(() => window._lact = Date.now(), 900_000);

  // Setup back to front logger
  if (is.dev()) {
    ipcRenderer.on('log', (_event, log: string) => {
      console.log(JSON.parse(log));
    });
  }
});

function listenForApiLoad() {
  api = $('#movie_player');
  if (api) {
    onApiLoaded();
    return;
  }

  const observer = new MutationObserver(() => {
    api = $('#movie_player');
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
  const video = $('video')!;
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
  ipcRenderer.send('apiLoaded');

  // Navigate to "Starting page"
  const startingPage: string = config.get('options.startingPage');
  if (startingPage && startingPages[startingPage]) {
    $<YouTubeMusicAppElement>('ytmusic-app')?.navigate_(startingPages[startingPage]);
  }

  // Remove upgrade button
  if (config.get('options.removeUpgradeButton')) {
    const styles = document.createElement('style');
    styles.innerHTML = `ytmusic-guide-section-renderer #items ytmusic-guide-entry-renderer:nth-child(4) {
      display: none;
    }`;
    document.head.appendChild(styles);
  }

  // Hide / Force show like buttons
  const likeButtonsOptions: string = config.get('options.likeButtons');
  if (likeButtonsOptions) {
    const likeButtons: HTMLElement | null = $('ytmusic-like-button-renderer');
    if (likeButtons) {
      likeButtons.style.display
        = {
        hide: 'none',
        force: 'inherit',
      }[likeButtonsOptions] || '';
    }
  }
}
