import { SongInfo } from '@/providers/song-info';

import { LineLyrics, LRCLIBSearchResponse } from '../../types';
import { syncedLyricList, config } from '../renderer';

// eslint-disable-next-line prefer-const
export let hadSecondAttempt = false;
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

  const minutes = parseInt(groups[1]);
  const seconds = parseInt(groups[2]);
  const milliseconds = parseInt(groups[3]);

  // prettier-ignore
  const text = groups[4] === ' '
      ? config!.defaultTextString
      : groups[4].slice(1);

  const time = `${minutes}:${seconds}:${milliseconds}`;
  const timeInMs = minutes * 60 * 1000 + seconds * 1000 + milliseconds;

  return <LineLyrics>{
    index,
    time,
    timeInMs,
    text,
    status: 'upcoming',
  };
};

export const makeLyricsRequest = async (
  extractedSongInfo: SongInfo,
): Promise<Array<LineLyrics> | null> => {
  const songData = {
    title: `${extractedSongInfo.title}`,
    artist: `${extractedSongInfo.artist}`,
    album: `${extractedSongInfo.album}`,
    songDuration: extractedSongInfo.songDuration,
  } as SongData;

  return await getLyricsList(songData);
};

export const getLyricsList = async (
  songData: SongData,
): Promise<Array<LineLyrics> | null> => {
  let query = new URLSearchParams({
    artist_name: songData.artist,
    track_name: songData.title,
  });

  if (songData.album) {
    query.set('album_name', songData.album);
  }

  let url = `https://lrclib.net/api/search?${query.toString()}`;
  let response = await fetch(url);
  if (!response.ok) return null;

  let data = (await response.json()) as LRCLIBSearchResponse;

  // Note: If no lyrics are found, try again with a different search query
  if (data.length === 0) {
    if (!config?.showLyricsEvenIfInexact) {
      return null;
    }

    query = new URLSearchParams({
      q: songData.title,
    });

    url = `https://lrclib.net/api/search?${query.toString()}`;
    response = await fetch(url);
    if (!response.ok) return null;
    data = (await response.json()) as LRCLIBSearchResponse;
  }

  // Note: Lowercase to avoid case sensitivity from API
  // TODO(Arjix): Maybe use levenstein or Jaro-Winkler distances with a similarity ratio instead.
  const songsWithMatchingArtist = data.filter(
    (song) =>
      songData.artist.toLowerCase().includes(song.artistName.toLowerCase()) &&
      song.syncedLyrics,
  );

  if (!songsWithMatchingArtist.length) return null;

  let idx = 0;
  for (let i = 0; i < songsWithMatchingArtist.length; i++) {
    // Picks the closest result based on the duration.
    if (
      Math.abs(songsWithMatchingArtist[i].duration - songData.songDuration) <
      Math.abs(songsWithMatchingArtist[idx].duration - songData.songDuration)
    ) {
      idx = i;
    }
  }

  data = songsWithMatchingArtist;
  if (Math.abs(data[idx].duration - songData.songDuration) > 5) return null;

  // Separate the lyrics into lines
  const raw = data[idx].syncedLyrics.split('\n');

  // Add a blank line at the beginning
  raw.unshift('[0:0.0] ');

  raw.forEach((line: string, index: number) => {
    const syncedLyrics = extractTimeAndText(line, index);
    if (syncedLyrics !== null) syncedLyricList.push(syncedLyrics);
  });

  return syncedLyricList;
};
