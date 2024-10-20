import { LyricProvider } from '@/plugins/synced-lyrics/types';

export const YTMusic: LyricProvider = {
  name: 'YTMusic',
  homepage: 'https://music.youtube.com/',

  async search() {
    return null;
  },
} as const;
