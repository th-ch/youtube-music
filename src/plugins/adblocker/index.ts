import { contextBridge, webFrame } from 'electron';

import { blockers, EnhancedAdBlockerSettings } from './types';
import { createPlugin } from '@/utils';
import {
  isBlockerEnabled,
  loadAdBlockerEngine,
  unloadAdBlockerEngine,
  getBlockingStats,
} from './blocker';

import { inject, isInjected } from './injectors/inject';
import {
  inject as injectEnhanced,
  isInjected as isEnhancedInjected,
} from './injectors/enhanced-inject';
import { loadAdSpeedup } from './adSpeedup';
import {
  loadEnhancedAdSkipper,
  getAdSkipStats,
  resetAdSkipStats,
} from './adEnhancedSkipper';

import { t } from '@/i18n';

import type { BrowserWindow } from 'electron';

interface AdblockerConfig {
  /**
   * Whether to enable the adblocker.
   * @default true
   */
  enabled: boolean;
  /**
   * When enabled, the adblocker will cache the blocklists.
   * @default true
   */
  cache: boolean;
  /**
   * Which adblocker to use.
   * @default blockers.InPlayer
   */
  blocker: (typeof blockers)[keyof typeof blockers];
  /**
   * Additional list of filters to use.
   * @example ["https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt"]
   * @default []
   */
  additionalBlockLists: string[];
  /**
   * Disable the default blocklists.
   * @default false
   */
  disableDefaultLists: boolean;
  /**
   * Enhanced ad blocker settings
   */
  enhancedSettings: EnhancedAdBlockerSettings;
}

export default createPlugin({
  name: () => t('plugins.adblocker.name'),
  description: () => t('plugins.adblocker.description'),
  restartNeeded: false,
  config: {
    enabled: true,
    cache: true,
    blocker: blockers.EnhancedAdBlocker, // Set enhanced blocker as default
    additionalBlockLists: [],
    disableDefaultLists: false,
    enhancedSettings: {
      adPlaybackSpeed: 16,
      muteAds: true,
      showIndicator: true,
      aggressiveMode: false,
    },
  } as AdblockerConfig,
  menu: async ({ getConfig, setConfig }) => {
    const config = await getConfig();

    return [
      {
        label: t('plugins.adblocker.menu.blocker'),
        submenu: Object.values(blockers).map((blocker) => ({
          label: blocker,
          type: 'radio',
          checked: (config.blocker || blockers.EnhancedAdBlocker) === blocker,
          click() {
            setConfig({ blocker });
          },
        })),
      },
      {
        type: 'separator',
      },
      {
        label: 'Enhanced Ad Blocker Settings',
        submenu: [
          {
            label: 'Ad Playback Speed',
            submenu: [1, 2, 4, 8, 16, 32].map((speed) => ({
              label: `${speed}x`,
              type: 'radio',
              checked:
                (config.enhancedSettings?.adPlaybackSpeed || 16) === speed,
              click() {
                setConfig({
                  enhancedSettings: {
                    ...config.enhancedSettings,
                    adPlaybackSpeed: speed,
                  },
                });
              },
            })),
          },
          {
            label: 'Mute Ads',
            type: 'checkbox',
            checked: config.enhancedSettings?.muteAds !== false,
            click(item) {
              setConfig({
                enhancedSettings: {
                  ...config.enhancedSettings,
                  muteAds: item.checked,
                },
              });
            },
          },
          {
            label: 'Show Ad Blocking Indicator',
            type: 'checkbox',
            checked: config.enhancedSettings?.showIndicator !== false,
            click(item) {
              setConfig({
                enhancedSettings: {
                  ...config.enhancedSettings,
                  showIndicator: item.checked,
                },
              });
            },
          },
          {
            label: 'Aggressive Mode',
            type: 'checkbox',
            checked: config.enhancedSettings?.aggressiveMode === true,
            click(item) {
              setConfig({
                enhancedSettings: {
                  ...config.enhancedSettings,
                  aggressiveMode: item.checked,
                },
              });
            },
          },
          {
            type: 'separator',
          },
          {
            label: 'Reset Ad Skip Statistics',
            click() {
              resetAdSkipStats();
            },
          },
        ],
      },
    ];
  },
  renderer: {
    async onPlayerApiReady(_, { getConfig }) {
      const config = await getConfig();

      // Start the appropriate ad blocker based on config
      if (config.blocker === blockers.AdSpeedup) {
        await loadAdSpeedup();
      } else if (config.blocker === blockers.EnhancedAdBlocker) {
        await loadEnhancedAdSkipper(config.enhancedSettings);
      }
    },

    // Add method to get ad blocking statistics
    getAdBlockingStats() {
      return {
        ...getAdSkipStats(),
      };
    },
  },
  backend: {
    mainWindow: null as BrowserWindow | null,
    async start({ getConfig, window }) {
      const config = await getConfig();
      this.mainWindow = window;

      if (
        config.blocker === blockers.WithBlocklists ||
        config.blocker === blockers.EnhancedAdBlocker
      ) {
        await loadAdBlockerEngine(
          window.webContents.session,
          config.cache,
          config.additionalBlockLists,
          config.disableDefaultLists
        );
      }
    },
    stop({ window }) {
      if (isBlockerEnabled(window.webContents.session)) {
        unloadAdBlockerEngine(window.webContents.session);
      }
    },
    async onConfigChange(newConfig) {
      if (this.mainWindow) {
        if (
          (newConfig.blocker === blockers.WithBlocklists ||
            newConfig.blocker === blockers.EnhancedAdBlocker) &&
          !isBlockerEnabled(this.mainWindow.webContents.session)
        ) {
          await loadAdBlockerEngine(
            this.mainWindow.webContents.session,
            newConfig.cache,
            newConfig.additionalBlockLists,
            newConfig.disableDefaultLists
          );
        }
      }
    },

    // New method to get backend ad blocking stats
    getBackendBlockingStats() {
      return getBlockingStats();
    },
  },
  preload: {
    script: `const _prunerFn = window._pruner;
    const _enhancedPrunerFn = window._enhancedPruner;
    window._pruner = undefined;
    window._enhancedPruner = undefined;

    // Use enhanced pruner if available, otherwise fall back to regular pruner
    const pruner = _enhancedPrunerFn || _prunerFn;

    // Apply DOM cleaning if available
    if (typeof window._setupAdDomCleaner === 'function') {
      window._adDomObserver = window._setupAdDomCleaner();
    }

    // Proxy JSON.parse to remove ad objects
    JSON.parse = new Proxy(JSON.parse, {
      apply() {
        return pruner(Reflect.apply(...arguments));
      },
    });

    // Proxy Response.prototype.json to clean ad objects
    Response.prototype.json = new Proxy(Response.prototype.json, {
      apply() {
        return Reflect.apply(...arguments).then((o) => pruner(o));
      },
    });

    // Intercept XMLHttpRequest to block ad-related requests
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      if (typeof url === 'string') {
        // Block ad-related XHR requests
        if (
          url.includes('pagead') ||
          url.includes('doubleclick.net') ||
          url.includes('/ad_') ||
          url.includes('/ads') ||
          url.includes('googleads') ||
          url.includes('googlesyndication') ||
          (url.includes('youtube') && url.includes('_ads'))
        ) {
          // Replace with empty URL to prevent request
          url = 'data:,';
        }
      }
      return originalXhrOpen.call(this, method, url, ...rest);
    };

    // Intercept YouTube's ad-related fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
      const url = input?.toString() || '';

      // Block requests to known ad endpoints
      if (
        url.includes('pagead') ||
        url.includes('doubleclick.net') ||
        url.includes('/ad_') ||
        url.includes('/ads') ||
        url.includes('googleads') ||
        url.includes('googlesyndication') ||
        (url.includes('youtube') && url.includes('_ads'))
      ) {
        // Return empty response for ad requests
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Let other requests through
      return originalFetch.apply(this, arguments);
    }

    // Prevent ad-related properties from being added to window/document
    const blockProperties = [
      'adPlacements',
      'google_ad_client',
      'google_ad_channel',
      'google_ad_host',
      'ytplayer.config.loaded'
    ];

    blockProperties.forEach(prop => {
      try {
        Object.defineProperty(window, prop, {
          set: () => {},
          get: () => undefined,
          configurable: false
        });
      } catch (e) {
        // Some properties might already be defined
      }
    });

    // Keep track of time between ad skips to prevent excessive skipping
    let lastAdSkipTime = 0;

    // Add event listener to auto-skip ads when they appear
    document.addEventListener('timeupdate', function(e) {
      if (e.target instanceof HTMLVideoElement) {
        const now = Date.now();
        if (now - lastAdSkipTime > 500) {  // Prevent too frequent skips
          const player = document.getElementById('movie_player');
          if (player &&
             (player.classList.contains('ad-showing') ||
              player.classList.contains('ad-interrupting'))) {
            // Auto-skip to end of ad
            if (e.target.duration > 0) {
              e.target.currentTime = Math.max(e.target.duration - 0.1, e.target.currentTime);
              lastAdSkipTime = now;
            }
          }
        }
      }
    }, true);
    `,

    async start({ getConfig }) {
      const config = await getConfig();

      if (
        config.blocker === blockers.InPlayer ||
        config.blocker === blockers.EnhancedAdBlocker
      ) {
        // Use enhanced injector for enhanced blocker and standard for regular in-player
        if (config.blocker === blockers.EnhancedAdBlocker) {
          if (!isEnhancedInjected()) {
            injectEnhanced(contextBridge);
          }
        } else if (!isInjected()) {
          inject(contextBridge);
        }

        await webFrame.executeJavaScript(this.script);
      }
    },

    async onConfigChange(newConfig) {
      if (
        newConfig.blocker === blockers.InPlayer ||
        newConfig.blocker === blockers.EnhancedAdBlocker
      ) {
        // Use enhanced injector for enhanced blocker and standard for regular in-player
        if (newConfig.blocker === blockers.EnhancedAdBlocker) {
          if (!isEnhancedInjected()) {
            injectEnhanced(contextBridge);
            await webFrame.executeJavaScript(this.script);
          }
        } else if (!isInjected()) {
          inject(contextBridge);
          await webFrame.executeJavaScript(this.script);
        }
      }
    },
  },
});
