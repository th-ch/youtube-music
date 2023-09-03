import { ipcRenderer } from 'electron';
import is from 'electron-is';

import config from './config';
import { fileExists } from './plugins/utils';
import setupSongInfo from './providers/song-info-front';
import { setupSongControls } from './providers/song-controls-front';
import { startingPages } from './providers/extracted-data';


const plugins = config.plugins.getEnabled();

const $ = document.querySelector.bind(document);

let api: Element | null = null;

interface Actions {
  CHANNEL: string;
  ACTIONS: Record<string, string>,
  actions: Record<string, () => void>,
}

plugins.forEach(async ([plugin, options]) => {
  const preloadPath = await ipcRenderer.invoke(
    'getPath',
    __dirname,
    'plugins',
    plugin,
    'preload.js',
  ) as string;
  fileExists(preloadPath, () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-member-access
    const run = require(preloadPath).default as (config: typeof options) => Promise<void>;
    run(options);
  });

  const actionPath = await ipcRenderer.invoke(
    'getPath',
    __dirname,
    'plugins',
    plugin,
    'actions.js',
  ) as string;
  fileExists(actionPath, () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const actions = (require(actionPath) as Actions).actions ?? {};

    // TODO: re-enable once contextIsolation is set to true
    // contextBridge.exposeInMainWorld(plugin + "Actions", actions);
    for (const actionName of Object.keys(actions)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
      (global as any)[actionName] = actions[actionName];
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  plugins.forEach(async ([plugin, options]) => {
    const pluginPath = await ipcRenderer.invoke(
      'getPath',
      __dirname,
      'plugins',
      plugin,
      'front.js',
    ) as string;
    fileExists(pluginPath, () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unsafe-member-access
      const run = require(pluginPath).default as (config: typeof options) => Promise<void>;
      run(options);
    });
  });

  // Wait for complete load of youtube api
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
    ($('ytmusic-app') as YouTubeMusicAppElement)?.navigate_(startingPages[startingPage]);
  }

  // Remove upgrade button
  if (config.get('options.removeUpgradeButton')) {
    const styles = document.createElement('style');
    styles.innerHTML = `ytmusic-guide-section-renderer #items ytmusic-guide-entry-renderer:last-child {
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
