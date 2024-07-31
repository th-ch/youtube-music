import { createSignal } from 'solid-js';
import { jaroWinkler } from '@skyra/jaro-winkler';

import { SongInfo } from '@/providers/song-info';

import { LineLyrics, LRCLIBSearchResponse } from '../../types';
import { config } from '../renderer';
import { setDebugInfo, setLineLyrics } from '../components/LyricsContainer';

// prettier-ignore
export const [isInstrumental, setIsInstrumental] = createSignal(false);
// prettier-ignore
export const [isFetching, setIsFetching] = createSignal(false);
// prettier-ignore
export const [hadSecondAttempt, setHadSecondAttempt] = createSignal(false);
// prettier-ignore
export const [differentDuration, setDifferentDuration] = createSignal(false);
// eslint-disable-next-line prefer-const
export let foundPlainTextLyrics = false;

export type SongData = {
  title: string;
  artist: string;
  album: string;
  songDuration: number;
};

export const extractTimeAndText = (
  line: string,
  index: number,
): LineLyrics | null => {
  const groups = /\[(\d+):(\d+)\.(\d+)\](.+)/.exec(line);
  if (!groups) return null;

  const [_, rMinutes, rSeconds, rMillis, text] = groups;
  const [minutes, seconds, millis] = [
    parseInt(rMinutes),
    parseInt(rSeconds),
    parseInt(rMillis),
  ];

  // prettier-ignore
  const timeInMs = (minutes * 60 * 1000) + (seconds * 1000) + millis;

  return {
    index,
    timeInMs,
    time: `${minutes}:${seconds}:${millis}`,
    text: text?.trim() ?? config()!.defaultTextString,
    status: 'upcoming',
    duration: 0,
  };
};

export const makeLyricsRequest = async (extractedSongInfo: SongInfo) => {
  setLineLyrics([]);
  const songData: SongData = {
    title: `${extractedSongInfo.title}`,
    artist: `${extractedSongInfo.artist}`,
    album: `${extractedSongInfo.album}`,
    songDuration: extractedSongInfo.songDuration,
  };

  const lyrics = await getLyricsList(songData);
  setLineLyrics(lyrics ?? []);
};

export const getLyricsList = async (
  songData: SongData,
): Promise<LineLyrics[] | null> => {
  setIsFetching(true);
  setIsInstrumental(false);
  setHadSecondAttempt(false);
  setDifferentDuration(false);
  setDebugInfo('Searching for lyrics...');

  let query = new URLSearchParams({
    artist_name: songData.artist,
    track_name: songData.title,
  });

  if (songData.album) {
    query.set('album_name', songData.album);
  }

  let url = `https://lrclib.net/api/search?${query.toString()}`;
  let response = await fetch(url);

  if (!response.ok) {
    setIsFetching(false);
    setDebugInfo('Got non-OK response from server.');
    return null;
  }

  let data = (await response.json().catch((e: Error) => {
    setDebugInfo(`Error: ${e.message}\n\n${e.stack}`);

    return null;
  })) as LRCLIBSearchResponse | null;
  if (!data || !Array.isArray(data)) {
    setIsFetching(false);
    setDebugInfo('Unexpected server response.');
    return null;
  }

  // Note: If no lyrics are found, try again with a different search query
  if (data.length === 0) {
    if (!config()?.showLyricsEvenIfInexact) {
      return null;
    }

    query = new URLSearchParams({ q: songData.title });
    url = `https://lrclib.net/api/search?${query.toString()}`;

    response = await fetch(url);
    if (!response.ok) {
      setIsFetching(false);
      setDebugInfo('Got non-OK response from server. (2)');
      return null;
    }

    data = (await response.json()) as LRCLIBSearchResponse;
    if (!Array.isArray(data)) {
      setIsFetching(false);
      setDebugInfo('Unexpected server response. (2)');
      return null;
    }

    setHadSecondAttempt(true);
  }

  const filteredResults = [];
  for (const item of data) {
    if (!item.syncedLyrics) continue;

    const { artist } = songData;
    const { artistName } = item;

    const ratio = jaroWinkler(artist.toLowerCase(), artistName.toLowerCase());

    if (ratio <= 0.9) continue;
    filteredResults.push(item);
  }

  const duration = songData.songDuration;
  filteredResults.sort(({ duration: durationA }, { duration: durationB }) => {
    const left = Math.abs(durationA - duration);
    const right = Math.abs(durationB - duration);

    return left - right;
  });

  const closestResult = filteredResults[0];
  if (!closestResult) {
    setIsFetching(false);
    setDebugInfo('No search result matched the criteria.');
    return null;
  }

  //   setDebugInfo(JSON.stringify(closestResult, null, 4));

  if (Math.abs(closestResult.duration - duration) > 15) return null;
  if (Math.abs(closestResult.duration - duration) > 5) {
    // show message that the timings may be wrong
    setDifferentDuration(true);
  }

  setIsInstrumental(closestResult.instrumental);

  // Separate the lyrics into lines
  const raw = closestResult.syncedLyrics.split('\n');

  // Add a blank line at the beginning
  raw.unshift('[0:0.0] ');

  const syncedLyricList = [];

  for (let idx = 0; idx < raw.length; idx++) {
    const syncedLine = extractTimeAndText(raw[idx], idx);
    if (syncedLine) {
      syncedLyricList.push(syncedLine);
    }
  }

  for (const line of syncedLyricList) {
    const next = syncedLyricList[line.index + 1];
    if (!next) {
      line.duration = Infinity;
      break;
    }

    line.duration = next.timeInMs - line.timeInMs;
  }

  setIsFetching(false);
  return syncedLyricList;
};
