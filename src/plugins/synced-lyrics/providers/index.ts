import { SongInfo } from '@/providers/song-info';

import { LRCLib } from './LRCLib';
import { LyricsGenius } from './LyricsGenius';

import type { LyricProvider, LyricResult } from '../types';
import { createSignal } from 'solid-js';

export const providers: LyricProvider[] = [
  LRCLib,
  LyricsGenius
] as const;

type ProviderName = string;
type VideoId = string;

const [accessor, setter] = createSignal<Record<ProviderName, LyricResult | null>>({});
export const searchResults = accessor;

const searchCache = new Map<VideoId, Record<ProviderName, LyricResult | null>>();
export const fetchLyrics = (info: SongInfo) => {
  if (searchCache.has(info.videoId)) {
    return;
  }

  // prevent duplicate requests by pre-emptively setting an empty value
  searchCache.set(info.videoId, {});

  for (const provider of providers) {
    provider.search(info)
      .then((res) => {
        const cache = searchCache.get(info.videoId)!;

        cache[provider.name] = res;
        setter(cache);
      });
  }
};
