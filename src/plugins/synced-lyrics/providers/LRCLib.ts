import { jaroWinkler } from '@skyra/jaro-winkler';

import type { LyricProvider } from '../types';
import { config } from '../renderer/renderer';
import { LRC } from '../parsers/lrc';

export const LRCLib: LyricProvider = {
  name: 'LRCLib',
  baseUrl: 'https://lrclib.net',

  async search({ title, artist, album, songDuration }) {
    let query = new URLSearchParams({
      artist_name: artist,
      track_name: title,
    });

    query.set('album_name', album!);
    if (query.get('album_name') === 'undefined') {
      query.delete('album_name');
    }

    let url = `${this.baseUrl}/api/search?${query.toString()}`;
    let response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    let data = (await response.json()) as LRCLIBSearchResponse;
    if (!data || !Array.isArray(data)) {
      return null;
    }

    if (data.length === 0) {
      if (!config()?.showLyricsEvenIfInexact) {
        return null;
      }

      query = new URLSearchParams({ q: title });
      url = `${this.baseUrl}/api/search?${query.toString()}`;

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

      const ratio = Math.max(
        ...permutations.map(([x, y]) => jaroWinkler(x, y)),
      );

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
        lines: [],
      };
    }

    const raw = closestResult.syncedLyrics;
    if (!raw) return null;

    const lyrics = LRC.parse(raw);
    return {
      title: closestResult.trackName,
      artists: closestResult.artistName.split(/[&,]/g),
      lines: lyrics.lines.map((l) => ({ ...l, status: 'upcoming' })),
    };
  },
} as const;

type LRCLIBSearchResponse = {
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
