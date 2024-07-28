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

export type PlayPauseEvent = {
  isPaused: boolean;
  elapsedSeconds: number;
};

export type LineEffect = 'scale' | 'offset' | 'focus';

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
