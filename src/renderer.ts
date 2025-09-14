import i18next from 'i18next';

import { startingPages } from './providers/extracted-data';
import { setupSongInfo } from './providers/song-info-front';
import {
  createContext,
  forceLoadRendererPlugin,
  forceUnloadRendererPlugin,
  getAllLoadedRendererPlugins,
  getLoadedRendererPlugin,
  loadAllRendererPlugins,
} from './loader/renderer';

import { loadI18n, setLanguage, t as i18t } from '@/i18n';

import {
  defaultTrustedTypePolicy,
  registerWindowDefaultTrustedTypePolicy,
} from '@/utils/trusted-types';

import type { PluginConfig } from '@/types/plugins';
import type { YoutubePlayer } from '@/types/youtube-player';
import type { QueueElement } from '@/types/queue';
import type { QueueResponse } from '@/types/youtube-music-desktop-internal';
import type { YouTubeMusicAppElement } from '@/types/youtube-music-app-element';
import type { SearchBoxElement } from '@/types/search-box-element';

let api: (Element & YoutubePlayer) | null = null;
let isPluginLoaded = false;
let isApiLoaded = false;
let firstDataLoaded = false;

registerWindowDefaultTrustedTypePolicy();

async function listenForApiLoad() {
  if (!isApiLoaded) {
    api = document.querySelector('#movie_player');
    if (api) {
      await onApiLoaded();

      return;
    }
  }
}

async function onApiLoaded() {
  // Workaround for macOS traffic lights
  {
    let osType = 'Unknown';
    if (window.electronIs.osx()) {
      osType = 'Macintosh';
    } else if (window.electronIs.windows()) {
      osType = 'Windows';
    } else if (window.electronIs.linux()) {
      osType = 'Linux';
    }
    document.documentElement.setAttribute('data-os', osType);
  }

  // Workaround for #2459
  document
    .querySelector('button.video-button.ytmusic-av-toggle')
    ?.addEventListener('click', () =>
      window.dispatchEvent(new Event('resize')),
    );

  window.ipcRenderer.on('ytmd:previous-video', () => {
    document
      .querySelector<HTMLElement>('.previous-button.ytmusic-player-bar')
      ?.click();
  });
  window.ipcRenderer.on('ytmd:next-video', () => {
    document
      .querySelector<HTMLElement>('.next-button.ytmusic-player-bar')
      ?.click();
  });
  window.ipcRenderer.on('ytmd:play', (_) => {
    api?.playVideo();
  });
  window.ipcRenderer.on('ytmd:pause', (_) => {
    api?.pauseVideo();
  });
  window.ipcRenderer.on('ytmd:toggle-play', (_) => {
    if (api?.getPlayerState() === 2) api?.playVideo();
    else api?.pauseVideo();
  });
  window.ipcRenderer.on('ytmd:seek-to', (_, t: number) => api!.seekTo(t));
  window.ipcRenderer.on('ytmd:seek-by', (_, t: number) => api!.seekBy(t));
  window.ipcRenderer.on('ytmd:shuffle', () => {
    document
      .querySelector<
        HTMLElement & { queue: { shuffle: () => void } }
      >('ytmusic-player-bar')
      ?.queue.shuffle();
  });

  const isShuffled = () => {
    const isShuffled =
      document
        .querySelector<HTMLElement>('ytmusic-player-bar')
        ?.attributes.getNamedItem('shuffle-on') ?? null;

    return isShuffled !== null;
  };

  window.ipcRenderer.on('ytmd:get-shuffle', () => {
    window.ipcRenderer.send('ytmd:get-shuffle-response', isShuffled());
  });

  window.ipcRenderer.on(
    'ytmd:update-like',
    (_, status: 'LIKE' | 'DISLIKE' = 'LIKE') => {
      document
        .querySelector<
          HTMLElement & { updateLikeStatus: (status: string) => void }
        >('#like-button-renderer')
        ?.updateLikeStatus(status);
    },
  );
  window.ipcRenderer.on('ytmd:switch-repeat', (_, repeat = 1) => {
    for (let i = 0; i < repeat; i++) {
      document
        .querySelector<
          HTMLElement & { onRepeatButtonClick: () => void }
        >('ytmusic-player-bar')
        ?.onRepeatButtonClick();
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

  const clickFullscreenButton = (isFullscreenValue: boolean) => {
    const fullscreen = isFullscreen();
    if (isFullscreenValue === fullscreen) {
      return;
    }

    if (fullscreen) {
      document.querySelector<HTMLElement>('.exit-fullscreen-button')?.click();
    } else {
      document.querySelector<HTMLElement>('.fullscreen-button')?.click();
    }
  };

  window.ipcRenderer.on('ytmd:get-fullscreen', () => {
    window.ipcRenderer.send('ytmd:set-fullscreen', isFullscreen());
  });

  window.ipcRenderer.on(
    'ytmd:click-fullscreen-button',
    (_, fullscreen: boolean | undefined) => {
      clickFullscreenButton(fullscreen ?? false);
    },
  );

  window.ipcRenderer.on('ytmd:toggle-mute', (_) => {
    document
      .querySelector<
        HTMLElement & { onVolumeClick: () => void }
      >('ytmusic-player-bar')
      ?.onVolumeClick();
  });

  window.ipcRenderer.on('ytmd:get-queue', () => {
    const queue = document.querySelector<QueueElement>('#queue');
    window.ipcRenderer.send('ytmd:get-queue-response', {
      items: queue?.queue.getItems(),
      autoPlaying: queue?.queue.autoPlaying,
      continuation: queue?.queue.continuation,
    } satisfies QueueResponse);
  });

  window.ipcRenderer.on(
    'ytmd:add-to-queue',
    (_, videoId: string, queueInsertPosition: string) => {
      const queue = document.querySelector<QueueElement>('#queue');
      const app = document.querySelector<YouTubeMusicAppElement>('ytmusic-app');
      if (!app) return;

      const store = queue?.queue.store.store;
      if (!store) return;

      app.networkManager
        .fetch('/music/get_queue', {
          queueContextParams: store.getState().queue.queueContextParams,
          queueInsertPosition,
          videoIds: [videoId],
        })
        .then((result) => {
          if (
            result &&
            typeof result === 'object' &&
            'queueDatas' in result &&
            Array.isArray(result.queueDatas)
          ) {
            const queueItems = store.getState().queue.items;
            const queueItemsLength = queueItems.length ?? 0;
            queue?.dispatch({
              type: 'ADD_ITEMS',
              payload: {
                nextQueueItemId: store.getState().queue.nextQueueItemId,
                index:
                  queueInsertPosition === 'INSERT_AFTER_CURRENT_VIDEO'
                    ? queueItems.findIndex(
                        (it) =>
                          (
                            it.playlistPanelVideoRenderer ||
                            it.playlistPanelVideoWrapperRenderer
                              ?.primaryRenderer.playlistPanelVideoRenderer
                          )?.selected,
                      ) + 1 || queueItemsLength
                    : queueItemsLength,
                items: result.queueDatas
                  .map((it) =>
                    typeof it === 'object' && it && 'content' in it
                      ? it.content
                      : null,
                  )
                  .filter(Boolean),
                shuffleEnabled: false,
                shouldAssignIds: true,
              },
            });
          }
        });
    },
  );
  window.ipcRenderer.on(
    'ytmd:move-in-queue',
    (_, fromIndex: number, toIndex: number) => {
      const queue = document.querySelector<QueueElement>('#queue');
      queue?.dispatch({
        type: 'MOVE_ITEM',
        payload: {
          fromIndex,
          toIndex,
        },
      });
    },
  );
  window.ipcRenderer.on('ytmd:remove-from-queue', (_, index: number) => {
    const queue = document.querySelector<QueueElement>('#queue');
    queue?.dispatch({
      type: 'REMOVE_ITEM',
      payload: index,
    });
  });
  window.ipcRenderer.on('ytmd:set-queue-index', (_, index: number) => {
    const queue = document.querySelector<QueueElement>('#queue');
    queue?.dispatch({
      type: 'SET_INDEX',
      payload: index,
    });
  });
  window.ipcRenderer.on('ytmd:clear-queue', () => {
    const queue = document.querySelector<QueueElement>('#queue');
    queue?.queue.store.store.dispatch({
      type: 'SET_PLAYER_PAGE_INFO',
      payload: { open: false },
    });
    queue?.dispatch({
      type: 'CLEAR',
    });
  });

  window.ipcRenderer.on(
    'ytmd:search',
    async (_, query: string, params?: string, continuation?: string) => {
      const app = document.querySelector<YouTubeMusicAppElement>('ytmusic-app');
      const searchBox =
        document.querySelector<SearchBoxElement>('ytmusic-search-box');

      if (!app || !searchBox) return;

      const result = await app.networkManager.fetch<
        unknown,
        {
          query: string;
          params?: string;
          continuation?: string;
          suggestStats?: unknown;
        }
      >('/search', {
        query,
        params,
        continuation,
        suggestStats: searchBox.getSearchboxStats(),
      });

      window.ipcRenderer.send('ytmd:search-results', result);
    },
  );

  const video = document.querySelector('video')!;
  const audioContext = new AudioContext();
  const audioSource = audioContext.createMediaElementSource(video);
  audioSource.connect(audioContext.destination);

  for (const [id, plugin] of Object.entries(getAllLoadedRendererPlugins())) {
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
      ?.navigate(startingPages[startingPage]);
  }

  // Remove upgrade button
  if (window.mainConfig.get('options.removeUpgradeButton')) {
    const itemsSelector = 'ytmusic-guide-section-renderer #items';
    let selector = 'ytmusic-guide-entry-renderer:last-child';

    const upgradeBtnIcon = document.querySelector<SVGGElement>(
      'iron-iconset-svg[name="yt-sys-icons"] #youtube_music_monochrome',
    );
    if (upgradeBtnIcon) {
      const path = upgradeBtnIcon.firstChild as SVGPathElement;
      const data = path.getAttribute('d')!.substring(0, 15);
      selector = `ytmusic-guide-entry-renderer:has(> tp-yt-paper-item > yt-icon path[d^="${data}"])`;
    }

    const styles = document.createElement('style');
    styles.textContent = `${itemsSelector} ${selector} { display: none; }`;

    document.head.appendChild(styles);
  }

  // Hide / Force show like buttons
  const likeButtonsOptions: string = window.mainConfig.get(
    'options.likeButtons',
  );
  if (likeButtonsOptions) {
    const style = document.createElement('style');
    style.textContent = `
      ytmusic-player-bar[is-mweb-player-bar-modernization-enabled] .middle-controls-buttons.ytmusic-player-bar, #like-button-renderer {
        display: ${likeButtonsOptions === 'hide' ? 'none' : 'inherit'} !important;
      }
      ytmusic-player-bar[is-mweb-player-bar-modernization-enabled] .middle-controls.ytmusic-player-bar {
        justify-content: ${likeButtonsOptions === 'hide' ? 'flex-start' : 'space-between'} !important;
      }`;

    document.head.appendChild(style);
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
      const targetHtml = i18t(key);
      (that.innerHTML as string | TrustedHTML) = defaultTrustedTypePolicy
        ? defaultTrustedTypePolicy.createHTML(targetHtml)
        : targetHtml;
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
  if (document.body?.dataset?.os) {
    document.body.dataset.os = navigator.userAgent;
  }
};

const injectPWABridge = () => {
  // Inject PWA bridge script for enhanced functionality
  try {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    
    // Inline the PWA bridge script content
    script.textContent = `
// PWA Integration for YouTube Music Electron App
// This script adds PWA functionality to the YouTube Music web interface

class ElectronPWABridge {
  constructor() {
    this.isElectron = true;
    this.init();
  }

  init() {
    // Add PWA-like functionality to the electron app
    this.addInstallPrompt();
    this.addOfflineSupport();
    this.addShareSupport();
    this.setupMediaSession();
  }

  addInstallPrompt() {
    // Create a mock PWA install experience for users who want to share the app
    const installButton = document.createElement('button');
    installButton.id = 'electron-pwa-share-btn';
    installButton.innerHTML = '📤 Share App';
    installButton.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 0, 0, 0.9);
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      z-index: 10000;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      opacity: 0.8;
    \`;

    installButton.addEventListener('mouseenter', () => {
      installButton.style.opacity = '1';
      installButton.style.transform = 'scale(1.05)';
    });

    installButton.addEventListener('mouseleave', () => {
      installButton.style.opacity = '0.8';
      installButton.style.transform = 'scale(1)';
    });

    installButton.addEventListener('click', () => {
      this.showShareDialog();
    });

    // Only show if not in fullscreen mode
    const checkFullscreen = () => {
      const isFullscreen = document.fullscreenElement || 
                          document.webkitFullscreenElement ||
                          document.mozFullScreenElement;
      installButton.style.display = isFullscreen ? 'none' : 'block';
    };

    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('mozfullscreenchange', checkFullscreen);

    document.body.appendChild(installButton);
  }

  showShareDialog() {
    const dialog = document.createElement('div');
    dialog.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      backdrop-filter: blur(5px);
    \`;

    const content = document.createElement('div');
    content.style.cssText = \`
      background: #222;
      color: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    \`;

    content.innerHTML = \`
      <h2 style="margin-top: 0; color: #ff0000;">Share YouTube Music</h2>
      <p style="margin: 20px 0; line-height: 1.5;">
        Share the YouTube Music Desktop App with others! They can install it as a PWA on their mobile devices 
        or download the desktop version.
      </p>
      <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 25px 0;">
        <button id="copy-pwa-link" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          📱 Copy PWA Link
        </button>
        <button id="copy-github-link" style="background: #333; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          💻 Copy GitHub Link
        </button>
        <button id="share-native" style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          🔗 Native Share
        </button>
      </div>
      <button id="close-share-dialog" style="background: transparent; color: #ccc; border: 1px solid #555; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
        Close
      </button>
    \`;

    dialog.appendChild(content);
    document.body.appendChild(dialog);

    // Event listeners
    content.querySelector('#copy-pwa-link').addEventListener('click', () => {
      this.copyToClipboard('https://th-ch.github.io/youtube-music/', 'PWA link copied!');
    });

    content.querySelector('#copy-github-link').addEventListener('click', () => {
      this.copyToClipboard('https://github.com/th-ch/youtube-music', 'GitHub link copied!');
    });

    content.querySelector('#share-native').addEventListener('click', () => {
      this.nativeShare();
    });

    content.querySelector('#close-share-dialog').addEventListener('click', () => {
      dialog.remove();
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });
  }

  async copyToClipboard(text, successMessage = 'Copied!') {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast(successMessage);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showToast(successMessage);
    }
  }

  async nativeShare() {
    const shareData = {
      title: 'YouTube Music Desktop App',
      text: 'Check out this awesome YouTube Music desktop app with PWA support!',
      url: 'https://github.com/th-ch/youtube-music'
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback to copying
      this.copyToClipboard(\`\${shareData.title}\\n\${shareData.text}\\n\${shareData.url}\`, 'Share info copied!');
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = \`
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 5px;
      z-index: 10002;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    \`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  addOfflineSupport() {
    // Monitor online/offline status
    const updateOnlineStatus = () => {
      const status = navigator.onLine ? 'online' : 'offline';
      const message = navigator.onLine ? '✅ Back online' : '⚠️ You are offline';
      
      if (!navigator.onLine) {
        this.showToast(message);
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  addShareSupport() {
    // Add share buttons to songs (if not already present)
    const addShareButton = (container) => {
      if (container.querySelector('.pwa-share-btn')) return;

      const shareBtn = document.createElement('button');
      shareBtn.className = 'pwa-share-btn';
      shareBtn.innerHTML = '🔗';
      shareBtn.title = 'Share this song';
      shareBtn.style.cssText = \`
        background: none;
        border: none;
        color: white;
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        margin-left: 8px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
      \`;

      shareBtn.addEventListener('mouseenter', () => {
        shareBtn.style.opacity = '1';
      });

      shareBtn.addEventListener('mouseleave', () => {
        shareBtn.style.opacity = '0.7';
      });

      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.shareSong();
      });

      container.appendChild(shareBtn);
    };

    // Observe for player changes
    const observer = new MutationObserver(() => {
      const playerBar = document.querySelector('.ytmusic-player-bar');
      if (playerBar) {
        addShareButton(playerBar);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  shareSong() {
    const titleElement = document.querySelector('.title.ytmusic-player-bar');
    const artistElement = document.querySelector('.byline.ytmusic-player-bar');
    const title = titleElement?.textContent || 'Unknown Title';
    const artist = artistElement?.textContent || 'Unknown Artist';

    const shareData = {
      title: \`\${title} - \${artist}\`,
      text: \`Currently listening to "\${title}" by \${artist} on YouTube Music\`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      this.copyToClipboard(\`\${shareData.title}\\n\${shareData.url}\`, 'Song info copied!');
    }
  }

  setupMediaSession() {
    // Enhanced media session for PWA-like behavior
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        document.querySelector('[data-id="play-pause-button"]')?.click();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        document.querySelector('[data-id="play-pause-button"]')?.click();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        document.querySelector('.previous-button')?.click();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        document.querySelector('.next-button')?.click();
      });

      // Update media session when song changes
      const updateMediaSession = () => {
        const title = document.querySelector('.title.ytmusic-player-bar')?.textContent || '';
        const artist = document.querySelector('.byline.ytmusic-player-bar')?.textContent || '';
        const artwork = document.querySelector('.image.ytmusic-player-bar img')?.src || '';

        if (title && artist) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            artwork: artwork ? [{ src: artwork, sizes: '512x512', type: 'image/jpeg' }] : []
          });
        }
      };

      const observer = new MutationObserver(updateMediaSession);
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ElectronPWABridge();
  });
} else {
  new ElectronPWABridge();
}`;

    document.head.appendChild(script);
    console.log('[PWA] Bridge script injected successfully');
  } catch (error) {
    console.error('[PWA] Failed to inject bridge script:', error);
  }
};

const main = async () => {
  await loadAllRendererPlugins();
  isPluginLoaded = true;

  // Inject PWA bridge for enhanced functionality
  injectPWABridge();

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
