import { SongInfo } from '@/providers/song-info';

export type SyncedLyricsPluginConfig = {
  enabled: boolean;
  preciseTiming: boolean;
  showTimeCodes: boolean;
  defaultTextString: string;
  showLyricsEvenIfInexact: boolean;
  lineEffect: LineEffect;
};

export type LineLyricsStatus = 'previous' | 'current' | 'upcoming';

export type LineLyrics = {
  time: string;
  timeInMs: number;
  duration: number;

  text: string;
  status: LineLyricsStatus;
};

export type LineEffect = 'scale' | 'offset' | 'focus';

export interface LyricResult {
  title: string;
  artists: string[];
  lines: LineLyrics[];
}

export interface LyricProvider {
  name: string;
  baseUrl: string;

  search(
    songInfo: Pick<SongInfo, 'title' | 'artist' | 'album' | 'songDuration'>,
  ): Promise<LyricResult | null>;
}
