import { VideoDataChangeValue } from '@/types/player-api-events';

export enum SyncFormat {
  None = 0,
  Line = 1,
  Word = 2,
}

export interface ReleaseDate {
  year: number;
  month: number;
  day: number;
}

export interface LyricsSearchResult {
  provider: string;

  lyricsType: SyncFormat;
  trackReleaseDate: ReleaseDate
}

export interface LyricsProvider {
  name: string;
  homepage: string;

  search(data: VideoDataChangeValue): Promise<LyricsSearchResult[]>;
}
