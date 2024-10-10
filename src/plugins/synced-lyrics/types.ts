import { Accessor, Setter } from 'solid-js';

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
  index: number;
  time: string;
  timeInMs: number;
  text: string;
  duration: number;
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
  homepage: string;

  // TODO: Was thinking of having provider-specific state here.
  //       e.g. isFetching, error
  accessor: Accessor<LyricResult | null>;
  setter: Setter<LyricResult | null>;

  search(songInfo: Pick<SongInfo, 'title' | 'artist' | 'album' | 'songDuration'>): Promise<LyricResult | null>
}

export type LRCLIBSearchResponse = {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string;
}[];
