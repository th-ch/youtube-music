import { BrowserWindow, ipcMain, net } from 'electron';
import is from 'electron-is';
import { convert } from 'html-to-text';

import style from './style.css';
import { GetGeniusLyric } from './types';

import { cleanupName, SongInfo } from '../../providers/song-info';

import { injectCSS } from '../utils';

import type { ConfigType } from '../../config/dynamic';

const eastAsianChars = /\p{Script=Katakana}|\p{Script=Hiragana}|\p{Script=Hangul}|\p{Script=Han}/u;
let revRomanized = false;

export type LyricGeniusType = ConfigType<'lyrics-genius'>;

export default (win: BrowserWindow, options: LyricGeniusType) => {
  if (options.romanizedLyrics) {
    revRomanized = true;
  }

  injectCSS(win.webContents, style);

  ipcMain.handle('search-genius-lyrics', async (_, extractedSongInfo: SongInfo) => {
    const metadata = extractedSongInfo;
    return await fetchFromGenius(metadata);
  });
};

export const toggleRomanized = () => {
  revRomanized = !revRomanized;
};

export const fetchFromGenius = async (metadata: SongInfo) => {
  const songTitle = `${cleanupName(metadata.title)}`;
  const songArtist = `${cleanupName(metadata.artist)}`;
  let lyrics: string | null;

  /* Uses Regex to test the title and artist first for said characters if romanization is enabled. Otherwise normal
  Genius Lyrics behavior is observed.
  */
  let hasAsianChars = false;
  if (revRomanized && (eastAsianChars.test(songTitle) || eastAsianChars.test(songArtist))) {
    lyrics = await getLyricsList(`${songArtist} ${songTitle} Romanized`);
    hasAsianChars = true;
  } else {
    lyrics = await getLyricsList(`${songArtist} ${songTitle}`);
  }

  /* If the romanization toggle is on, and we did not detect any characters in the title or artist, we do a check
  for characters in the lyrics themselves. If this check proves true, we search for Romanized lyrics.
  */
  if (revRomanized && !hasAsianChars && lyrics && eastAsianChars.test(lyrics)) {
    lyrics = await getLyricsList(`${songArtist} ${songTitle} Romanized`);
  }

  return lyrics;
};

/**
 * Fetches a JSON of songs which is then parsed and passed into getLyrics to get the lyrical content of the first song
 * @param {*} queryString
 * @returns The lyrics of the first song found using the Genius-Lyrics API
 */
const getLyricsList = async (queryString: string): Promise<string | null> => {
  const response = await net.fetch(
    `https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(queryString)}`,
  );
  if (!response.ok) {
    return null;
  }

  /* Fetch the first URL with the api, giving a collection of song results.
  Pick the first song, parsing the json given by the API.
  */
  const info = await response.json() as GetGeniusLyric;
  const url = info
    ?.response
    ?.sections
    ?.find((section) => section.type === 'song')?.hits[0]?.result?.url;

  if (url) {
    return await getLyrics(url);
  } else {
    return null;
  }
};

/**
 *
 * @param {*} url
 * @returns The lyrics of the song URL provided, null if none
 */
const getLyrics = async (url: string): Promise<string | null> => {
  const response = await net.fetch(url);
  if (!response.ok) {
    return null;
  }

  if (is.dev()) {
    console.log('Fetching lyrics from Genius:', url);
  }

  const html = await response.text();
  return convert(html, {
    baseElements: {
      selectors: ['[class^="Lyrics__Container"]', '.lyrics'],
    },
    selectors: [
      {
        selector: 'a',
        format: 'linkFormatter',
      },
    ],
    formatters: {
      // Remove links by keeping only the content
      linkFormatter(element, walk, builder) {
        walk(element.children, builder);
      },
    },
  });
};
