import { jaroWinkler } from '@skyra/jaro-winkler';

import { type LineLyrics, type LRCLIBSearchResponse, LyricProvider, LyricResult } from '../types';
import { config } from '../renderer/renderer';
import { createSignal } from 'solid-js';

function extractTimeAndText(line: string, index: number): LineLyrics | null {
  const groups = /\[(\d+):(\d+)\.(\d+)\](.+)/.exec(line);
  if (!groups) return null;

  const [, rMinutes, rSeconds, rMillis, text] = groups;
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
    time: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${millis}`,
    text: text?.trim() ?? config()!.defaultTextString,
    status: 'upcoming',
    duration: 0,
  };
}

const [accessor, setter] = createSignal<LyricResult | null>(null);
export const LRCLib: LyricProvider = {
  accessor, setter,

  name: 'LRCLib',
  homepage: 'https://lrclib.net/',

  async search({ title, artist, album, songDuration }) {
    let query = new URLSearchParams({
      artist_name: artist,
      track_name: title,
    });

    query.set('album_name', album!);
    if (query.get('album_name') === 'undefined') {
      query.delete('album_name');
    }

    let url = `https://lrclib.net/api/search?${query.toString()}`;
    let response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    let data = await response.json() as LRCLIBSearchResponse;
    if (!data || !Array.isArray(data)) {
      return null;
    }

    if (data.length === 0) {
      if (!config()?.showLyricsEvenIfInexact) {
        return null;
      }

      query = new URLSearchParams({ q: title });
      url = `https://lrclib.net/api/search?${query.toString()}`;

      response = await fetch(url);
      if (!response.ok) {
        return null;
      }

      data = (await response.json()) as LRCLIBSearchResponse;
      if (!Array.isArray(data)) {
        return null;
      }
    }

    const filteredResults = [];
    for (const item of data) {
      const { artistName } = item;

      const artists = artist.split(/[&,]/g).map((i) => i.trim());
      const itemArtists = artistName.split(/[&,]/g).map((i) => i.trim());

      const permutations = [];
      for (const artistA of artists) {
        for (const artistB of itemArtists) {
          permutations.push([artistA.toLowerCase(), artistB.toLowerCase()]);
        }
      }

      for (const artistA of itemArtists) {
        for (const artistB of artists) {
          permutations.push([artistA.toLowerCase(), artistB.toLowerCase()]);
        }
      }

      const ratio = Math.max(...permutations.map(([x, y]) => jaroWinkler(x, y)));

      if (ratio <= 0.9) continue;
      filteredResults.push(item);
    }

    filteredResults.sort(({ duration: durationA }, { duration: durationB }) => {
      const left = Math.abs(durationA - songDuration);
      const right = Math.abs(durationB - songDuration);

      return left - right;
    });

    const closestResult = filteredResults[0];
    if (!closestResult) {
      return null;
    }

    if (Math.abs(closestResult.duration - songDuration) > 15) {
      return null;
    }

    if (closestResult.instrumental) {
      return {
        title: closestResult.trackName,
        artists: closestResult.artistName.split(/[&,]/g),
        lines: []
      };
    }

    const raw = closestResult.syncedLyrics?.split('\n') ?? [];
    if (!raw.length) {
      return null;
    }

    // Add a blank line at the beginning
    raw.unshift('[0:0.0] ');

    const syncedLyricList = raw.reduce<LineLyrics[]>((acc, line, index) => {
      const syncedLine = extractTimeAndText(line, index);
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

    return {
      title: closestResult.trackName,
      artists: closestResult.artistName.split(/[&,]/g),
      lines: syncedLyricList
    };
  }
};
