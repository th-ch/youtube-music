// Used for caching
import path from 'node:path';
import { promises } from 'node:fs';

import { ElectronBlocker } from '@cliqz/adblocker-electron';

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

export const loadAdBlockerEngine = (
  session: Electron.Session | undefined = undefined,
  cache = true,
  additionalBlockLists = [],
  disableDefaultLists: boolean | string[] = false,
) => {
  // Only use cache if no additional blocklists are passed
  const cachingOptions
    = cache && additionalBlockLists.length === 0
    ? {
      path: path.resolve(__dirname, 'ad-blocker-engine.bin'),
      read: promises.readFile,
      write: promises.writeFile,
    }
    : undefined;
  const lists = [
    ...(disableDefaultLists ? [] : SOURCES),
    ...additionalBlockLists,
  ];

  ElectronBlocker.fromLists(
    fetch,
    lists,
    {
      // When generating the engine for caching, do not load network filters
      // So that enhancing the session works as expected
      // Allowing to define multiple webRequest listeners
      loadNetworkFilters: session !== undefined,
    },
    cachingOptions,
  )
    .then((blocker) => {
      if (session) {
        blocker.enableBlockingInSession(session);
      } else {
        console.log('Successfully generated adBlocker engine.');
      }
    })
    .catch((error) => console.log('Error loading adBlocker engine', error));
};

export default { loadAdBlockerEngine };
if (require.main === module) {
  loadAdBlockerEngine(); // Generate the engine without enabling it
}
