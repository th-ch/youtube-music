import { createSignal } from 'solid-js';
import { jaroWinkler } from '@skyra/jaro-winkler';

import { config } from '../renderer';

import { setDebugInfo, setLineLyrics } from '../components/LyricsContainer';

import type { SongInfo } from '@/providers/song-info';
import type { LineLyrics, LRCLIBSearchResponse } from '../../types';

export const [isInstrumental, setIsInstrumental] = createSignal(false);
export const [isFetching, setIsFetching] = createSignal(false);
export const [hadSecondAttempt, setHadSecondAttempt] = createSignal(false);
export const [differentDuration, setDifferentDuration] = createSignal(false);

export const extractTimeAndText = (
  line: string,
  index: number,
): LineLyrics | null => {
  const groups = /\[(\d+):(\d+)\.(\d+)](.+)/.exec(line);
  if (!groups) return null;

  const [, rMinutes, rSeconds, rMillis, text] = groups;
  const [minutes, seconds, millis] = [
    parseInt(rMinutes),
    parseInt(rSeconds),
    parseInt(rMillis),
  ];

  const timeInMs = minutes * 60 * 1000 + seconds * 1000 + millis;

  return {
    index,
    timeInMs,
    time: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${millis}`,
    text: text?.trim() || config()!.defaultTextString,
    status: 'upcoming',
    duration: 0,
  };
};

export const makeLyricsRequest = async (extractedSongInfo: SongInfo) => {
  setIsFetching(true);
  setLineLyrics([]);

  const songData: Parameters<typeof getLyricsList>[0] = {
    title: `${extractedSongInfo.title}`,
    artist: `${extractedSongInfo.artist}`,
    songDuration: extractedSongInfo.songDuration,
  };

  if (extractedSongInfo.album) {
    songData.album = extractedSongInfo.album;
  }

  let lyrics;
  try {
    lyrics = await getLyricsList(songData);
  } catch {}

  setLineLyrics(lyrics ?? []);
  setIsFetching(false);
};

export const getLyricsList = async (
  songData: Pick<SongInfo, 'title' | 'artist' | 'album' | 'songDuration'>,
): Promise<LineLyrics[] | null> => {
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
    setDebugInfo('Got non-OK response from server.');
    return null;
  }

  let data = (await response.json()) as LRCLIBSearchResponse;
  if (!data || !Array.isArray(data)) {
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
      setDebugInfo('Got non-OK response from server. (2)');
      return null;
    }

    data = (await response.json()) as LRCLIBSearchResponse;
    if (!Array.isArray(data)) {
      setDebugInfo('Unexpected server response. (2)');
      return null;
    }

    setHadSecondAttempt(true);
  }

  const filteredResults: LRCLIBSearchResponse = [];
  for (const item of data) {
    const { artist } = songData;
    const { artistName } = item;

    const artists = artist.split(/[&,]/g).map((i) => i.trim());
    const itemArtists = artistName.split(/[&,]/g).map((i) => i.trim());

    const permutations = artists.flatMap((artistA) =>
      itemArtists.map((artistB) => [
        artistA.toLowerCase(),
        artistB.toLowerCase(),
      ]),
    );

    const ratio = Math.max(...permutations.map(([x, y]) => jaroWinkler(x, y)));
    if (ratio > 0.9) filteredResults.push(item);
  }

  const duration = songData.songDuration;
  filteredResults.sort(({ duration: durationA }, { duration: durationB }) => {
    const left = Math.abs(durationA - duration);
    const right = Math.abs(durationB - duration);

    return left - right;
  });

  const closestResult = filteredResults[0];
  if (!closestResult) {
    setDebugInfo('No search result matched the criteria.');
    return null;
  }

  setDebugInfo(JSON.stringify(closestResult, null, 4));

  if (Math.abs(closestResult.duration - duration) > 15) {
    return null;
  }

  if (Math.abs(closestResult.duration - duration) > 5) {
    // show message that the timings may be wrong
    setDifferentDuration(true);
  }

  setIsInstrumental(closestResult.instrumental);
  if (closestResult.instrumental) {
    return null;
  }

  // Separate the lyrics into lines
  const raw = closestResult.syncedLyrics?.split('\n') ?? [];
  if (!raw.length) {
    return null;
  }

  // Add a blank line at the beginning
  raw.unshift('[0:0.0] ');

  const syncedLyricList = raw.reduce<LineLyrics[]>((acc, line) => {
    const syncedLine = extractTimeAndText(line, acc.length);
    if (syncedLine) {
      acc.push(syncedLine);
    }

    return acc;
  }, []);

  for (const line of syncedLyricList) {
    const next = syncedLyricList[line.index + 1];
    if (!next) {
      line.duration = Infinity;
      break;
    }

    line.duration = next.timeInMs - line.timeInMs;
  }

  return syncedLyricList;
};
