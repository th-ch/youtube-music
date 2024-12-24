import type { LyricProvider, LyricResult, SearchSongInfo } from '../types';

export class MusixMatch implements LyricProvider {
  name = 'MusixMatch';
  baseUrl = 'https://www.musixmatch.com/';

  search(_: SearchSongInfo): Promise<LyricResult | null> {
    throw new Error('Not implemented');
  }
}
