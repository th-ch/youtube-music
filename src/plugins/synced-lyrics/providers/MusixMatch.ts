import { LyricProvider } from '@/plugins/synced-lyrics/types';

export const MusixMatch: LyricProvider = {
  name: 'MusixMatch',
  baseUrl: 'https://www.musixmatch.com/',

  async search() {
    throw new Error('Not implemented');
    return null;
  },
} as const;
