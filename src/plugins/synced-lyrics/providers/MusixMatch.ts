import { LyricProvider, LyricResult, SearchSongInfo } from '../types';

export class MusixMatch implements LyricProvider {
  name = 'MusixMatch';
  baseUrl = 'https://www.musixmatch.com/';

  async search({}: SearchSongInfo): Promise<LyricResult | null> {
    throw new Error('Not implemented');
    return null;
  }
}
