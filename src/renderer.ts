import i18next from 'i18next';

import { startingPages } from './providers/extracted-data';
import setupSongInfo from './providers/song-info-front';
import {
  createContext,
  forceLoadRendererPlugin,
  forceUnloadRendererPlugin,
  getAllLoadedRendererPlugins,
  getLoadedRendererPlugin,
  loadAllRendererPlugins,
} from './loader/renderer';

import { loadI18n, setLanguage, t as i18t } from '@/i18n';

import { type PlaylistSongInfo } from './providers/song-info';

import type { PluginConfig } from '@/types/plugins';
import type { YoutubePlayer } from '@/types/youtube-player';

let api: (Element & YoutubePlayer) | null = null;
let isPluginLoaded = false;
let isApiLoaded = false;
let firstDataLoaded = false;

async function listenForApiLoad() {
  if (!isApiLoaded) {
    api = document.querySelector('#movie_player');
    if (api) {
      await onApiLoaded();

      return;
    }
  }
}

export interface Queue {
  currentPosition: number;
  songs: PlaylistSongInfo[];
  autoplay: boolean;
}

interface YouTubeMusicAppElement extends HTMLElement {
  navigate_(page: string): void;
}

async function onApiLoaded() {
  window.ipcRenderer.on('ytmd:previous-video', () => {
    document.querySelector<HTMLElement>('.previous-button.ytmusic-player-bar')?.click();
  });
  window.ipcRenderer.on('ytmd:next-video', () => {
    document.querySelector<HTMLElement>('.next-button.ytmusic-player-bar')?.click();
  });
  window.ipcRenderer.on('ytmd:toggle-play', (_) => {
    if (api?.getPlayerState() === 2) api?.playVideo();
    else api?.pauseVideo();
  });
  window.ipcRenderer.on('ytmd:seek-to', (_, t: number) => api!.seekTo(t));
  window.ipcRenderer.on('ytmd:seek-by', (_, t: number) => api!.seekBy(t));
  window.ipcRenderer.on('ytmd:shuffle', () => {
    document.querySelector<HTMLElement & { queue: { shuffle: () => void } }>('ytmusic-player-bar')?.queue.shuffle();
  });
  window.ipcRenderer.on('ytmd:update-like', (_, status: 'LIKE' | 'DISLIKE' = 'LIKE') => {
    document.querySelector<HTMLElement & { updateLikeStatus: (status: string) => void }>('#like-button-renderer')?.updateLikeStatus(status);
  });
  window.ipcRenderer.on('ytmd:switch-repeat', (_, repeat = 1) => {
    for (let i = 0; i < repeat; i++) {
      document.querySelector<HTMLElement & { onRepeatButtonTap: () => void }>('ytmusic-player-bar')?.onRepeatButtonTap();
    }
  });
  window.ipcRenderer.on('ytmd:update-volume', (_, volume: number) => {
    document
      .querySelector<
        HTMLElement & { updateVolume: (volume: number) => void }
      >('ytmusic-player-bar')
      ?.updateVolume(volume);
  });

  const isFullscreen = () => {
    const isFullscreen =
      document
        .querySelector<HTMLElement>('ytmusic-player-bar')
        ?.attributes.getNamedItem('player-fullscreened') ?? null;

    return isFullscreen !== null;
  };

  const setFullscreen = (isFullscreenValue: boolean) => {
    if (isFullscreenValue == isFullscreen()) {
      return;
    }

    if (isFullscreen()) {
      document.querySelector<HTMLElement>('.exit-fullscreen-button')?.click();
    } else {
      document.querySelector<HTMLElement>('.fullscreen-button')?.click();
    }
  };

  window.ipcRenderer.on('ytmd:get-fullscreen', (event) => {
    event.sender.send('ytmd:set-fullscreen', isFullscreen());
  });

  window.ipcRenderer.on(
    'ytmd:set-fullscreen',
    (_, isFullscreenValue: boolean) => {
      setFullscreen(isFullscreenValue);
    },
  );

  const getQueue = (): Queue | null => {
    const queueElement = document.querySelector<HTMLElement>(
      'ytmusic-player-queue',
    );
    const autoplaySlider = document.querySelector<HTMLInputElement>(
      '.autoplay > tp-yt-paper-toggle-button',
    );

    if (!queueElement || !autoplaySlider) {
      return null;
    }

    const autoplay: boolean = autoplaySlider.checked;

    const allItems = queueElement.querySelectorAll<HTMLElement>(
      'ytmusic-player-queue-item',
    );

    const currentPosition: number = Array.from(allItems)
      .map((element) => {
        const value =
          element.attributes.getNamedItem('play-button-state')?.value ??
          'default';
        return value !== 'default';
      })
      .reduce((value, isPlaying, index) => (isPlaying ? index : value), -1);

    const getSongDurationFromString = (
      durationString: string,
    ): number | null => {
      let result: number = 0;

      const fragments = durationString.split(':');
      if (fragments.length > 4) {
        return null;
      }

      let multiplierIndex = 0;

      const multipliers = [1, 60, 60 * 60, 60 * 60 * 24];

      fragments.reverse();

      for (const fragment of fragments) {
        const parsedNumber = parseInt(fragment);
        if (isNaN(parsedNumber)) {
          return null;
        }

        result += parsedNumber * multipliers[multiplierIndex];
        ++multiplierIndex;
      }

      return result;
    };

    const songs: PlaylistSongInfo[] = [];

    for (const playlistElement of allItems) {
      const parentID = (playlistElement?.parentNode as HTMLElement | undefined)
        ?.id;

      const isAutoplaySong =
        parentID === 'contents'
          ? false
          : parentID === 'automix-contents'
            ? true
            : undefined;

      if (!autoplay && isAutoplaySong) {
        continue;
      }

      const image = playlistElement.querySelector<HTMLImageElement>('img')!;

      const songInfoNode =
        playlistElement.querySelector<HTMLElement>('.song-info')!;

      const title =
        songInfoNode.querySelector<HTMLElement>('.song-title')!.textContent!;
      const artist =
        songInfoNode.querySelector<HTMLElement>('.byline')!.textContent!;

      const durationString =
        playlistElement.querySelector<HTMLElement>('.duration')!.textContent!;

      const songDuration =
        getSongDurationFromString(durationString) ?? undefined;

      // we can't get more info from this little html we have :(
      const songInfo: PlaylistSongInfo = {
        title,
        artist,
        songDuration,
        imageSrc: image.src,
        isAutoplaySong,
      };

      songs.push(songInfo);
    }

    if (songs.length === 0) {
      return null;
    }

    return { autoplay, currentPosition, songs };
  };

  window.ipcRenderer.on('ytmd:get-playlist', (event) => {
    window.ipcRenderer.send('ytmd:playlist-updated', getQueue());
  });

  window.ipcRenderer.on('ytmd:toggle-mute', (_) => {
    document.querySelector<HTMLElement & { onVolumeTap: () => void }>('ytmusic-player-bar')?.onVolumeTap();
  });

  const video = document.querySelector('video')!;
  const audioContext = new AudioContext();
  const audioSource = audioContext.createMediaElementSource(video);
  audioSource.connect(audioContext.destination);

  for await (const [id, plugin] of Object.entries(
    getAllLoadedRendererPlugins(),
  )) {
    if (typeof plugin.renderer !== 'function') {
      await plugin.renderer?.onPlayerApiReady?.call(
        plugin.renderer,
        api!,
        createContext(id),
      );
    }
  }

  if (firstDataLoaded) {
    document.dispatchEvent(
      new CustomEvent('videodatachange', { detail: { name: 'dataloaded' } }),
    );
  }

  const audioCanPlayEventDispatcher = () => {
    document.dispatchEvent(
      new CustomEvent('ytmd:audio-can-play', {
        detail: {
          audioContext,
          audioSource,
        },
      }),
    );
  };

  const loadstartListener = () => {
    // Emit "audioCanPlay" for each video
    video.addEventListener('canplaythrough', audioCanPlayEventDispatcher, {
      once: true,
    });
  };

  if (video.readyState === 4 /* HAVE_ENOUGH_DATA (loaded) */) {
    audioCanPlayEventDispatcher();
  }

  video.addEventListener('loadstart', loadstartListener, { passive: true });

  window.ipcRenderer.send('ytmd:player-api-loaded');

  // Navigate to "Starting page"
  const startingPage: string = window.mainConfig.get('options.startingPage');
  if (startingPage && startingPages[startingPage]) {
    document
      .querySelector<YouTubeMusicAppElement>('ytmusic-app')
      ?.navigate_(startingPages[startingPage]);
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
  const likeButtonsOptions: string = window.mainConfig.get(
    'options.likeButtons',
  );
  if (likeButtonsOptions) {
    const likeButtons: HTMLElement | null = document.querySelector(
      'ytmusic-like-button-renderer',
    );
    if (likeButtons) {
      likeButtons.style.display =
        {
          hide: 'none',
          force: 'inherit',
        }[likeButtonsOptions] || '';
    }
  }
}

/**
 * YouTube Music still using ES5, so we need to define custom elements using ES5 style
 */
const defineYTMDTransElements = () => {
  const YTMDTrans = function () {};
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  YTMDTrans.prototype = Object.create(HTMLElement.prototype);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  YTMDTrans.prototype.connectedCallback = function () {
    const that = this as HTMLElement;
    const key = that.getAttribute('key');
    if (key) {
      that.innerHTML = i18t(key);
    }
  };
  customElements.define(
    'ytmd-trans',
    YTMDTrans as unknown as CustomElementConstructor,
  );
};

const preload = async () => {
  await loadI18n();
  await setLanguage(window.mainConfig.get('options.language') ?? 'en');
  window.i18n = {
    t: i18t.bind(i18next),
  };
  defineYTMDTransElements();
};

const main = async () => {
  await loadAllRendererPlugins();
  isPluginLoaded = true;

  window.ipcRenderer.on('plugin:unload', async (_event, id: string) => {
    await forceUnloadRendererPlugin(id);
  });
  window.ipcRenderer.on('plugin:enable', async (_event, id: string) => {
    await forceLoadRendererPlugin(id);
    if (api) {
      const plugin = getLoadedRendererPlugin(id);
      if (plugin && typeof plugin.renderer !== 'function') {
        await plugin.renderer?.onPlayerApiReady?.call(
          plugin.renderer,
          api,
          createContext(id),
        );
      }
    }
  });

  window.ipcRenderer.on(
    'config-changed',
    (_event, id: string, newConfig: PluginConfig) => {
      const plugin = getAllLoadedRendererPlugins()[id];
      if (plugin && typeof plugin.renderer !== 'function') {
        plugin.renderer?.onConfigChange?.call(plugin.renderer, newConfig);
      }
    },
  );

  // Wait for complete load of YouTube api
  await listenForApiLoad();

  // Blocks the "Are You Still There?" popup by setting the last active time to Date.now every 15min
  setInterval(() => (window._lact = Date.now()), 900_000);

  // Setup back to front logger
  if (window.electronIs.dev()) {
    window.ipcRenderer.on('log', (_event, log: string) => {
      console.log(JSON.parse(log));
    });
  }
};

const initObserver = async () => {
  // check document.documentElement is ready
  await new Promise<void>((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => resolve(), {
        once: true,
      });
    } else {
      resolve();
    }
  });

  const observer = new MutationObserver(() => {
    const playerApi = document.querySelector<Element & YoutubePlayer>(
      '#movie_player',
    );
    if (playerApi) {
      observer.disconnect();

      // Inject song-info provider
      setupSongInfo(playerApi);
      const dataLoadedListener = (name: string) => {
        if (!firstDataLoaded && name === 'dataloaded') {
          firstDataLoaded = true;
          playerApi.removeEventListener('videodatachange', dataLoadedListener);
        }
      };
      playerApi.addEventListener('videodatachange', dataLoadedListener);

      if (isPluginLoaded && !isApiLoaded) {
        api = playerApi;
        isApiLoaded = true;

        onApiLoaded();
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
};

initObserver().then(preload).then(main);
