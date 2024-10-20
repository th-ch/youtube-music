import { createSignal } from 'solid-js';

import { LyricProvider, LyricResult } from '@/plugins/synced-lyrics/types';

export const LyricsGenius: LyricProvider = {
  name: 'Genius',
  homepage: 'https://genius.com/',

  async search() {
    return null;
  },
} as const;
