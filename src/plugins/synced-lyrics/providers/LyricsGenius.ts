import { createSignal } from 'solid-js';

import { LyricProvider, LyricResult } from '@/plugins/synced-lyrics/types';

const [accessor, setter] = createSignal<LyricResult | null>(null);
export const LyricsGenius: LyricProvider = {
  accessor, setter,

  name: 'Genius',
  homepage: 'https://genius.com/',

  async search() {
    return null;
  }
};
