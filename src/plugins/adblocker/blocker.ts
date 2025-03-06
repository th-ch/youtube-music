import path from 'node:path';
import fs, { promises } from 'node:fs';

import { ElectronBlocker } from '@ghostery/adblocker-electron';
import { app, net } from 'electron';

const SOURCES = [
  'https://raw.githubusercontent.com/kbinani/adblock-youtube-ads/master/signed.txt',
  // UBlock Origin
  'https://raw.githubusercontent.com/ghostery/adblocker/master/packages/adblocker/assets/ublock-origin/filters.txt',
  'https://raw.githubusercontent.com/ghostery/adblocker/master/packages/adblocker/assets/ublock-origin/quick-fixes.txt',
  'https://raw.githubusercontent.com/ghostery/adblocker/master/packages/adblocker/assets/ublock-origin/unbreak.txt',
  'https://raw.githubusercontent.com/ghostery/adblocker/master/packages/adblocker/assets/ublock-origin/filters-2020.txt',
  'https://raw.githubusercontent.com/ghostery/adblocker/master/packages/adblocker/assets/ublock-origin/filters-2021.txt',
  'https://raw.githubusercontent.com/ghostery/adblocker/master/packages/adblocker/assets/ublock-origin/filters-2022.txt',
  'https://raw.githubusercontent.com/ghostery/adblocker/master/packages/adblocker/assets/ublock-origin/filters-2023.txt',
  // Fanboy Annoyances
  'https://secure.fanboy.co.nz/fanboy-annoyance_ubo.txt',
  // AdGuard
  'https://filters.adtidy.org/extension/ublock/filters/122_optimized.txt',
  // Additional YouTube-specific filters
  'https://raw.githubusercontent.com/easylist/easylist/master/easylist/easylist_adservers_popup.txt',
  'https://raw.githubusercontent.com/brave/adblock-lists/master/brave-lists/brave-youtube.txt',
  // YouTube music specific filters
  'https://raw.githubusercontent.com/DandelionSprout/adfilt/master/BrowseWebsitesWithoutLoggingIn.txt',
];

// Tracking if a blocker is enabled and the instance
let blocker: ElectronBlocker | undefined;
let blockingStats = {
  adsBlocked: 0,
  lastUpdateTime: 0,
};

// Enhanced version of the ad blocker loader with better error handling
export const loadAdBlockerEngine = async (
  session: Electron.Session | undefined = undefined,
  cache: boolean = true,
  additionalBlockLists: string[] = [],
  disableDefaultLists: boolean | unknown[] = false
): Promise<void> => {
  try {
    // Only use cache if no additional blocklists are passed
    const cacheDirectory = path.join(app.getPath('userData'), 'adblock_cache');
    if (!fs.existsSync(cacheDirectory)) {
      fs.mkdirSync(cacheDirectory);
    }

    const cachingOptions =
      cache && additionalBlockLists.length === 0
        ? {
            path: path.join(cacheDirectory, 'adblocker-engine.bin'),
            read: promises.readFile,
            write: promises.writeFile,
          }
        : undefined;

    const lists = [
      ...((disableDefaultLists && !Array.isArray(disableDefaultLists)) ||
      (Array.isArray(disableDefaultLists) && disableDefaultLists.length > 0)
        ? []
        : SOURCES),
      ...additionalBlockLists,
    ];

    // Create blocker with improved configuration
    blocker = await ElectronBlocker.fromLists(
      (url: string) => net.fetch(url),
      lists,
      {
        enableCompression: true,
        loadNetworkFilters: session !== undefined,
        debug: process.env.NODE_ENV === 'development',
      },
      cachingOptions
    );

    // Set up request blocking and analytics
    if (session && blocker) {
      blocker.enableBlockingInSession(session);

      // Add tracking for blocked requests
      session.webRequest.onBeforeRequest((details, callback) => {
        const match = blocker?.match(details);
        if (match?.redirect || match?.match) {
          blockingStats.adsBlocked++;
          blockingStats.lastUpdateTime = Date.now();
        }
        callback({});
      });
    }
  } catch (error) {
    console.error('Failed to load ad blocker engine:', error);
    // Fallback to minimal blocking if full loading fails
    if (session) {
      try {
        blocker = await ElectronBlocker.empty();
        blocker.enableBlockingInSession(session);
      } catch (e) {
        console.error('Failed to create empty blocker:', e);
      }
    }
  }
};

export const unloadAdBlockerEngine = (session: Electron.Session): void => {
  if (blocker) {
    blocker.disableBlockingInSession(session);
  }
};

export const isBlockerEnabled = (session: Electron.Session): boolean =>
  blocker !== undefined && blocker.isBlockingEnabled(session);

// Get statistics about blocked ads
export const getBlockingStats = () => {
  return blockingStats;
};
