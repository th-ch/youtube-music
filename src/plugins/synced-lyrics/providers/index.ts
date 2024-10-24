import { SongInfo } from '@/providers/song-info';

import { LRCLib } from './LRCLib';
import { Megalobiz } from './Megalobiz';
import { MusixMatch } from './MusixMatch';
import { YTMusic } from './YTMusic';

import type { LyricProvider, LyricResult } from '../types';
import { createStore } from 'solid-js/store';
import { createMemo } from 'solid-js';

export const providers = {
  LRCLib,
  MusixMatch,
  YTMusic,
  Megalobiz,
} as const;

export type ProviderName = keyof typeof providers;
export const providerNames = Object.keys(providers) as ProviderName[];

export type ProviderState = {
  state: 'fetching' | 'done' | 'error';
  data: LyricResult | null;
  error: string | null;
};

type LyricsStore = {
  provider: ProviderName;
  current: ProviderState;
  lyrics: Record<ProviderName, ProviderState>;
};

const initialData = () =>
  providerNames.reduce(
    (acc, name) => {
      acc[name] = { state: 'fetching', data: null, error: null };
      return acc;
    },
    {} as LyricsStore['lyrics'],
  );

export const [lyricsStore, setLyricsStore] = createStore<LyricsStore>({
  provider: providerNames[0],
  lyrics: initialData(),
  get current() {
    return this.lyrics[this.provider];
  },
});

export const currentLyrics = createMemo(() => {
  const provider = lyricsStore.provider;
  return lyricsStore.lyrics[provider];
});

export const currentProvider = createMemo(() => {
  const provider = lyricsStore.provider;
  return lyricsStore.lyrics[provider];
});

type VideoId = string;

type SearchCacheData = Record<ProviderName, ProviderState>;
interface SearchCache {
  state: 'loading' | 'done';
  data: SearchCacheData;
}

// TODO: Maybe use localStorage for the cache.
const searchCache = new Map<VideoId, SearchCache>();
export const fetchLyrics = (info: SongInfo) => {
  if (searchCache.has(info.videoId)) {
    const cache = searchCache.get(info.videoId);
    if (cache?.state === 'done') {
      setLyricsStore('lyrics', cache.data);
    }

    return;
  }

  const cache: SearchCache = {
    state: 'loading',
    data: initialData(),
  };
  searchCache.set(info.videoId, cache);

  setLyricsStore('lyrics', cache.data);

  const tasks: Promise<void>[] = [];

  // prettier-ignore
  for (const [providerName, provider] of Object.entries(providers) as [ProviderName, LyricProvider][]) {
    const pCache = cache.data[providerName];

    tasks.push(
      provider
        .search(info)
        .then((res) => {
          pCache.state = 'done';
          pCache.data = res;

          setLyricsStore('lyrics', (old) => {
            return {
              ...old,
              [providerName]: { state: 'done', data: res ? { ...res } : null, error: null }
            };
          });
        })
        .catch((err) => {
          pCache.state = 'error';
          pCache.error = `${err}`;

          setLyricsStore('lyrics', (old) => {
            return {
              ...old,
              [providerName]: { state: 'done', error: `${err}`, data: null }
            };
          });
        })
    );
  }

  Promise.allSettled(tasks).then(() => {
    cache.state = 'done';
    searchCache.set(info.videoId, cache);
  });
};
