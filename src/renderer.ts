import setupSongInfo from './providers/song-info-front';
import { setupSongControls } from './providers/song-controls-front';
import { startingPages } from './providers/extracted-data';

// eslint-disable-next-line import/order
import { rendererPlugins } from 'virtual:RendererPlugins';

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
        console.error(`Error in plugin "${pluginName}"`);
        console.trace(error);
      }
    }
  });

  // Inject song-info provider
  setupSongInfo();

  // Inject song-controls
  setupSongControls();

  // Wait for complete load of YouTube api
  listenForApiLoad();

  // Blocks the "Are You Still There?" popup by setting the last active time to Date.now every 15min
  setInterval(() => window._lact = Date.now(), 900_000);

  // Setup back to front logger
  if (window.electronIs.dev()) {
    window.ipcRenderer.on('log', (_event, log: string) => {
      console.log(JSON.parse(log));
    });
  }
})();
