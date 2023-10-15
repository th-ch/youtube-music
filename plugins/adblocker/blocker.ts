// Used for caching
import path from 'node:path';
import fs, { promises } from 'node:fs';

import { ElectronBlocker } from '@cliqz/adblocker-electron';
import { app, net } from 'electron';

const SOURCES = [
  'https://raw.githubusercontent.com/kbinani/adblock-youtube-ads/master/signed.txt',
  // UBlock Origin
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters-2020.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters-2021.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters-2022.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters-2023.txt',
  // Fanboy Annoyances
  'https://secure.fanboy.co.nz/fanboy-annoyance_ubo.txt',
];

export const loadAdBlockerEngine = async (
  session: Electron.Session | undefined = undefined,
  cache = true,
  additionalBlockLists = [],
  disableDefaultLists: boolean | unknown[] = false,
) => {
  // Only use cache if no additional blocklists are passed
  const cacheDirectory = path.join(app.getPath('userData'), 'adblock_cache');
  if (!fs.existsSync(cacheDirectory)) {
    fs.mkdirSync(cacheDirectory);
  }
  const cachingOptions
    = cache && additionalBlockLists.length === 0
    ? {
      path: path.join(cacheDirectory, 'adblocker-engine.bin'),
      read: promises.readFile,
      write: promises.writeFile,
    }
    : undefined;
  const lists = [
    ...(
      (disableDefaultLists && !Array.isArray(disableDefaultLists)) ||
      (Array.isArray(disableDefaultLists) && disableDefaultLists.length > 0) ? [] : SOURCES
    ),
    ...additionalBlockLists,
  ];

  try {
    const blocker = await ElectronBlocker.fromLists(
      (url: string) => net.fetch(url),
      lists,
      {
        // When generating the engine for caching, do not load network filters
        // So that enhancing the session works as expected
        // Allowing to define multiple webRequest listeners
        loadNetworkFilters: session !== undefined,
      },
      cachingOptions,
    );
    if (session) {
      blocker.enableBlockingInSession(session);
    }
  } catch (error) {
    console.log('Error loading adBlocker engine', error);
  }
};

export default { loadAdBlockerEngine };
