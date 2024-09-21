import { SongInfo } from '@/providers/song-info';

import { LRCLib } from './LRCLib';
import { LyricsGenius } from './LyricsGenius';

import type { LyricProvider, LyricResult } from '../types';
import { createSignal } from 'solid-js';

export const providers: LyricProvider[] = [LRCLib, LyricsGenius] as const;

type ProviderName = string;
type VideoId = string;
interface SearchCache {
  state: 'loading' | 'done';
  data: Record<
    ProviderName,
    | { state: 'fetching' }
    | { state: 'error'; error: string }
    | { state: 'done'; data: LyricResult | null }
  >;
}

const [accessor, setter] = createSignal<SearchCache>({
  state: 'done',
  data: {},
});
export const searchResults = accessor;

const searchCache = new Map<VideoId, SearchCache>();
export const fetchLyrics = (info: SongInfo) => {
  if (searchCache.has(info.videoId)) {
    const cache = searchCache.get(info.videoId);

    if (cache?.state === 'done') setter(cache);
    else return; // still loading, so we return
  }

  // prevent duplicate requests by pre-emptively setting an empty value
  const cache: SearchCache = {
    state: 'loading',
    data: Object.fromEntries(
      providers.map((p) => [p.name, { state: 'fetching' }]),
    ),
  };
  searchCache.set(info.videoId, cache);

  const tasks: Promise<void>[] = [];
  for (const provider of providers) {
    const pCache = cache.data[provider.name];
    pCache.state = 'fetching';

    tasks.push(
      provider
        .search(info)
        .then((res) => {
          pCache.state = 'done';
          // @ts-ignore silly typescript
          pCache.data = res;
          setter(cache);
        })
        .catch((err) => {
          pCache.state = 'error';
          // @ts-ignore silly typescript
          pCache.error = `${err}`;
        }),
    );
  }

  Promise.all(tasks).then(() => {
    setter({ ...cache, state: 'done' });
  });
};
