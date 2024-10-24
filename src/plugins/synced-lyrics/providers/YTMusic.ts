import { LyricProvider } from '@/plugins/synced-lyrics/types';

export const YTMusic: LyricProvider = {
  name: 'YTMusic',
  baseUrl: 'https://music.youtube.com/',

  async search() {
    throw new Error('Not implemented');
    return null;
  },
} as const;
