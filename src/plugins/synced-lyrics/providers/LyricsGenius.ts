import { LyricProvider } from '@/plugins/synced-lyrics/types';

export const LyricsGenius: LyricProvider = {
  name: 'Genius',
  baseUrl: 'https://genius.com',

  async search({ title, artist, album, songDuration }) {
    // Only supports plain lyrics, not synced, for now it won't be used.
    return null;

    const query = new URLSearchParams({
      q: `${artist} ${title}`,
      page: '1',
      per_page: '10',
    });

    const response = await fetch(`${this.baseUrl}/api/search/lyric?${query}`);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    console.log(data);

    return null;
  },
} as const;
