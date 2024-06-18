import { net } from 'electron';
import is from 'electron-is';
import { convert } from 'html-to-text';

import { GetGeniusLyric } from './types';
import { cleanupName, type SongInfo } from '@/providers/song-info';

import type { SyncedLyricsPluginConfig } from './index';

import type { BackendContext } from '@/types/contexts';

export const onMainLoad = async ({
  ipc,
  getConfig,
}: BackendContext<SyncedLyricsPluginConfig>) => {
  const config = await getConfig();

  ipc.handle('search-synced-lyrics', async (extractedSongInfo: SongInfo) => {
    const metadata = extractedSongInfo;
    console.warn(metadata);
    return await fetchFromLRC(metadata);
  });
};

export const onConfigChange = (newConfig: SyncedLyricsPluginConfig) => {
  //
};

export const fetchFromLRC = async (metadata: SongInfo) => {
  const songTitle = `${cleanupName(metadata.title)}`;
  const songArtist = `${cleanupName(metadata.artist)}`;
  let lyrics: string | null;

  console.warn(metadata);
  lyrics = await getLyricsList(`${songArtist} ${songTitle}`);

  return lyrics;
};

/**
 * Fetches a JSON of songs which is then parsed and passed into getLyrics to get the lyrical content of the first song
 * @param {*} queryString
 * @returns The lyrics of the first song found using the Genius-Lyrics API
 */
const getLyricsList = async (queryString: string): Promise<string | null> => {
  const response = await net.fetch(
    `https://genius.com/api/search/multi?per_page=5&q=${encodeURIComponent(
      queryString,
    )}`,
  );
  if (!response.ok) {
    return null;
  }

  /* Fetch the first URL with the api, giving a collection of song results.
  Pick the first song, parsing the json given by the API.
  */
  const info = (await response.json()) as GetGeniusLyric;
  const url = info?.response?.sections?.find(
    (section) => section.type === 'song',
  )?.hits[0]?.result?.url;

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
