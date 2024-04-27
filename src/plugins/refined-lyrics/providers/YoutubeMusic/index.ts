import { LyricsProvider, LyricsSearchResult } from '@/plugins/refined-lyrics/providers/types';
import { VideoDataChangeValue } from '@/types/player-api-events';

export const YoutubeMusic: LyricsProvider = {
  name: 'YoutubeMusic',
  homepage: "https://music.youtube.com",

  async search(_data: VideoDataChangeValue): Promise<LyricsSearchResult[]> {
    return [];
  }
};
