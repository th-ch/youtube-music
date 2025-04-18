import { netFetch } from '../renderer';
import type { LyricProvider, LyricResult, SearchSongInfo } from '../types';

async function encode(array: ArrayBuffer): Promise<string> {
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

const ENDPOINTS = {
  GET_ARTIST: 'artist.get',
  GET_TRACK: 'track.get',
  GET_TRACK_LYRICS: 'track.lyrics.get',
  SEARCH_TRACK: 'track.search',
  SEARCH_ARTIST: 'artist.search',
  GET_ARTIST_CHART: 'chart.artists.get',
  GET_TRACK_CHART: 'chart.tracks.get',
  GET_ARTIST_ALBUMS: 'artist.albums.get',
  GET_ALBUM: 'album.get',
  GET_ALBUM_TRACKS: 'album.tracks.get',
  GET_TRACK_LYRICS_TRANSLATION: 'crowd.track.translations.get',
} as const;

export class MusixMatch implements LyricProvider {
  name = 'MusixMatch';
  baseUrl = 'https://www.musixmatch.com/ws/1.1/';

  private readonly textEncoder = new TextEncoder();
  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
  };

  private key: CryptoKey | null = null;
  private initPromise: Promise<void> | null = null;

  async search(info: SearchSongInfo): Promise<LyricResult | null> {
    if (this.initPromise === null) {
      this.initPromise = this.init();
    }

    await this.initPromise;

    await this.searchTracks(`${info.artist} - ${info.title}`);
    return null;
  }

  // prettier-ignore
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

  private async searchTracks(query: string) {
    const params = new URLSearchParams({
      app_id: 'mxm-com-v1.0',
      format: 'json',
      q: query,
      f_has_lyrics: 'true',
      page_size: '100',
      page: '1',
    });

    const url = `${this.baseUrl}${ENDPOINTS.SEARCH_TRACK}`;
    const [_, json] = await this.makeRequest(url, params);

    console.log(JSON.parse(json));
  }

  private async makeRequest(url: string, params: URLSearchParams) {
    await this.initPromise;

    const { signature, signature_protocol } = await this.generateSignature(
      url,
      params
    );
    params.append('signature', signature);
    params.append('signature_protocol', signature_protocol);

    return await netFetch(`${url}?${params}`);
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

    return { signature: await encode(hash), signature_protocol: 'sha256' };
  }
}
