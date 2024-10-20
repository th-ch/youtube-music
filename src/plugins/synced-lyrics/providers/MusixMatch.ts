import { LyricProvider } from '@/plugins/synced-lyrics/types';

export const MusixMatch: LyricProvider = {
  name: 'MusixMatch',
  homepage: 'https://www.musixmatch.com/',

  async search() {
    return null;
  },
} as const;
