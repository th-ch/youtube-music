import { jaroWinkler } from '@skyra/jaro-winkler';
import { netFetch } from '../renderer';
import type { LyricProvider, LyricResult, SearchSongInfo } from '../types';

export class MusixMatch implements LyricProvider {
  name = 'MusixMatch';
  baseUrl = 'https://www.musixmatch.com/';

  private api: MusixMatchAPI | undefined;

  async search(info: SearchSongInfo): Promise<LyricResult | null> {
    // late-init the API, to avoid an electron IPC issue
    this.api ??= new MusixMatchAPI();

    const queries = [];

    queries.push(`${info.artist} - ${info.title}`);

    if (info.album) {
      queries.push(`${info.album} - ${info.title}`);
    }

    if (info.alternativeTitle) {
      queries.push(`${info.artist} - ${info.alternativeTitle}`);
      if (info.album) queries.push(`${info.album} - ${info.alternativeTitle}`);
    }

    let track: Track | undefined = undefined;
    for (const query of queries) {
      const {
        body: { track_list },
      } = await this.api.query(Endpoint.searchTrack, {
        q: query,
        f_has_lyrics: 'true',
        page_size: '25',
        page: '1',
      });

      const tracks = track_list.reduce((accumulated, { track }) => {
        const artistRatio = jaroWinkler(info.artist, track.artist_name);
        if (artistRatio < 0.7) return accumulated;

        const titleRatio = Math.max(
          jaroWinkler(info.title, track.track_name),
          jaroWinkler(info.alternativeTitle ?? '', track.track_name)
        );

        if (titleRatio < 0.9) return accumulated;

        accumulated.push(track);
        return accumulated;
      }, [] as Track[]);

      track = tracks?.[0];
      if (track) break;
    }

    if (!track) return null;
    const {
      body: { lyrics },
    } = await this.api.query(Endpoint.getTrackLyrics, {
      track_id: track.track_id.toString(),
    });

    if (!lyrics.lyrics_body.trim()) return null;
    return {
      artists: [track.artist_name],
      title: track.track_name,
      lyrics: lyrics.lyrics_body,
    };
  }
}

// API Implementation, based on https://github.com/Strvm/musicxmatch-api/blob/main/src/musicxmatch_api/main.py

interface Track {
  track_id: number;
  track_mbid: string;
  track_isrc: string;
  commontrack_isrcs: Array<string[]>;
  track_spotify_id: string;
  commontrack_spotify_ids: string[];
  commontrack_itunes_ids: number[];
  track_soundcloud_id: number;
  track_xboxmusic_id: string;
  track_name: string;
  track_name_translation_list: any[];
  track_length: number;
  instrumental: number;
  has_lyrics: number;
  has_lyrics_crowd: number;
  has_subtitles: number;
  has_richsync: number;
  has_track_structure: number;
  lyrics_id: number;
  subtitle_id: number;
  album_id: number;
  album_name: string;
  artist_id: number;
  artist_mbid: string;
  artist_name: string;
}

interface Lyrics {
  instrumental: number;
  lyrics_body: string;
  lyrics_language: string;
  lyrics_language_description: string;
}

enum Endpoint {
  getArtist = 'artist.get',
  getTrack = 'track.get',
  getTrackLyrics = 'track.lyrics.get',
  searchTrack = 'track.search',
  searchArtist = 'artist.search',
  getTopArtists = 'chart.artists.get',
  getTopTracks = 'chart.tracks.get',
  getArtistAlbums = 'artist.albums.get',
  getAlbum = 'album.get',
  getAlbumTracks = 'album.tracks.get',
  getTrackLyricsTranslations = 'crowd.track.translations.get',
}

// prettier-ignore
type Params = {
  [Endpoint.getArtist]: { artist_id: string; };
  [Endpoint.getTrack]: { track_id: string; } | { track_isrc: string; };
  [Endpoint.getTrackLyrics]: { track_id: string; } | { track_isrc: string; };
  [Endpoint.searchTrack]: { q: string; f_has_lyrics: 'true' | 'false'; page_size: string; page: string; };
  [Endpoint.searchArtist]: { q_artist: string; page_size: string; page: string; };
  [Endpoint.getTopArtists]: { country: "US" | string; page_size: string; page: string; };
  [Endpoint.getTopTracks]: { country: "US" | string; page_size: string; page: string; };
  [Endpoint.getArtistAlbums]: { artist_id: string; page_size: string; page: string; };
  [Endpoint.getAlbum]: { album_id: string; };
  [Endpoint.getAlbumTracks]: { album_id: string; page_size: string; page: string; };
  [Endpoint.getTrackLyricsTranslations]: { track_id: string; selected_language: string };
};

type Response = {
  [Endpoint.searchTrack]: { track_list: { track: Track }[] };
  [Endpoint.getTrackLyrics]: { lyrics: Lyrics };
};

// prettier-ignore
class MusixMatchAPI {
  private readonly initPromise: Promise<void>;
  private key: CryptoKey | null = null;

  constructor() {
    this.initPromise = this.init();
  }

  // god I love typescript generics, they're so useful
  public async query<T extends Endpoint>(
    endpoint: T,
    params: Params[T]
  ): Promise<{
    header: { status_code: number; },
    body: T  extends keyof Response ? Response[T] : unknown
  }> {
    await this.initPromise;

    const url = `${this.baseUrl}${endpoint}`;

    const clonedParams = new URLSearchParams(Object.assign(
      {
        app_id: 'mxm-com-v1.0',
        format: 'json',
      }, params as any
    ));

    const { signature, signature_protocol } = await this.generateSignature(url, clonedParams);
    {
      clonedParams.append('signature', signature);
      clonedParams.append('signature_protocol', signature_protocol);
    }

    const [_, json] = await netFetch(`${url}?${clonedParams}`);
    return (JSON.parse(json) as any).message;
  }

  private async init() {
    const [_, html] = await netFetch("https://www.musixmatch.com/search", {
      headers: Object.assign({"Cookie": "mxm_bab=AB"}, this.headers)
    });

    const app = html.match(/(https:\/\/[^:]+_next\/static\/chunks\/pages\/_app-.+?\.js)/)?.[1];
    if (!app) throw new Error('Failed to find app.js');

    const [__, js] = await netFetch(app, { headers: this.headers });
    const base64 = js.match(/\.from\("([A-Za-z0-9+/=]+)"\.split\(""\)\.reverse\(\)\.join\(""\),"base64"\)/)?.[1];
    if (!base64) throw new Error('Failed to find secret');

    const secret = atob(base64.split("").reverse().join(""));
    this.key = await crypto.subtle.importKey("raw", this.textEncoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  }

  private async generateSignature(url: string, params: URLSearchParams) {
    await this.initPromise;

    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const message = [`${url}?${params}`, year, month, day].join('');

    const hash = await crypto.subtle.sign(
      'HMAC',
      this.key!,
      this.textEncoder.encode(message)
    );

    return { signature: await this.encode(hash), signature_protocol: 'sha256' };
  }

  private async encode(array: ArrayBuffer): Promise<string> {
    return new Promise((resolve) => {
      const blob = new Blob([array]);
      const reader = new FileReader();

      reader.onload = (event) => {
        const dataUrl = event.target!.result! as string;
        const [_, base64] = dataUrl.split(',');

        resolve(base64);
      };

      reader.readAsDataURL(blob);
    });
  }

  private readonly textEncoder = new TextEncoder();
  private readonly baseUrl = 'https://www.musixmatch.com/ws/1.1/';
  private readonly headers = {
    // prettier-ignore
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
  };
}
