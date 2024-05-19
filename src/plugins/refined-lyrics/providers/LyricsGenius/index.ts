import { LyricsProvider, LyricsSearchResult } from '@/plugins/refined-lyrics/providers/types';
import { VideoDataChangeValue } from '@/types/player-api-events';

export const LyricsGenius: LyricsProvider = {
  name: "LyricsGenius",
  homepage: "https://genius.com/",

  async search(_data: VideoDataChangeValue): Promise<LyricsSearchResult[]> {
    throw "NotImplemented";
  }
};
