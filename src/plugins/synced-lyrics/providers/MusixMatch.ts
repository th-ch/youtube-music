import { netFetch } from '../renderer';
import type { LyricProvider, LyricResult, SearchSongInfo } from '../types';
import { LRC } from '../parsers/lrc';

// prettier-ignore
export class MusixMatch implements LyricProvider {
  name = 'MusixMatch';
  baseUrl = 'https://www.musixmatch.com/';

  private api: MusixMatchAPI | undefined;

  async search(info: SearchSongInfo): Promise<LyricResult | null> {
    // late-init the API, to avoid an electron IPC issue
    this.api ??= await MusixMatchAPI.new();

    const queries = [];

    queries.push(`${info.artist} - ${info.title}`);

    if (info.album) {
      queries.push(`${info.album} - ${info.title}`);
    }

    if (info.alternativeTitle) {
      queries.push(`${info.artist} - ${info.alternativeTitle}`);
      if (info.album) queries.push(`${info.album} - ${info.alternativeTitle}`);
    }

    const data = await this.api.query(Endpoint.getMacroSubtitles, {
      q_track: info.title,
      q_artist: info.artist,
      q_album: info.album ? info.album : undefined,
      namespace: 'lyrics_richsynched',
      subtitle_format: 'lrc',
    });

    const track = data.body.macro_calls['matcher.track.get'].message.body.track;
    const lyrics = data.body.macro_calls['track.lyrics.get'].message.body.lyrics.lyrics_body;
    const subtitle = data.body.macro_calls['track.subtitles.get'].message.body.subtitle_list[0];

    return {
      title: track.track_name,
      artists: [track.artist_name],
      lines: subtitle
        ? LRC.parse(subtitle.subtitle.subtitle_body).lines.map((l) => ({
            ...l,
            status: 'upcoming' as const,
          }))
        : undefined,
      lyrics: lyrics,
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
  track_share_url: string;
  track_name_translation_list: any[];
  track_length: number;
  instrumental: 0 | 1;
  has_lyrics: 0 | 1;
  has_lyrics_crowd: 0 | 1;
  has_subtitles: 0 | 1;
  has_richsync: 0 | 1;
  has_track_structure: 0 | 1;
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

interface Subtitle {
  subtitle_body: string;
  subtitle_length: number;
  subtitle_language: string;
}

enum Endpoint {
  getMacroSubtitles = 'macro.subtitles.get',
  searchTrack = 'track.search',
}

// prettier-ignore
type Params = {
  [Endpoint.getMacroSubtitles]: { q_track: string, q_artist: string, q_album?: string, namespace: "lyrics_richsynched", subtitle_format: "lrc" };
  [Endpoint.searchTrack]: { q: string; f_has_lyrics: 'true' | 'false'; page_size: string; page: string; };
};

type Response = {
  [Endpoint.searchTrack]: { track_list: { track: Track }[] };
  [Endpoint.getMacroSubtitles]: {
    macro_calls: {
      'track.lyrics.get': { message: { body: { lyrics: Lyrics } } };
      'track.subtitles.get': {
        message: { body: { subtitle_list: { subtitle: Subtitle }[] } };
      };
      'matcher.track.get': { message: { body: { track: Track } } };
    };
  };
};

// prettier-ignore
class MusixMatchAPI {
  private readonly initPromise: Promise<void>;
  private cookie = 'x-mxm-user-id=';
  private token: string | null = null;

  private constructor() {
    this.initPromise = this.init();
  }

  public static async new() {
    const api = new MusixMatchAPI();
    await api.initPromise;
    return api;
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
    if (!this.token) throw new Error('Token not initialized');

    const url = `${this.baseUrl}${endpoint}`;

    const clonedParams = new URLSearchParams(Object.assign(
      {
        app_id: this.app_id,
        format: 'json',
        usertoken: this.token,
      }, params as any
    ));

    const [_, json, headers] = await netFetch(`${url}?${clonedParams}`, { headers: { Cookie: this.cookie } });

    const setCookie = Object.entries(headers).find(([key]) => key.toLowerCase() === 'set-cookie');
    if (setCookie) {
      this.cookie = setCookie[1];
    }

    return (JSON.parse(json) as any).message;
  }

  private async init() {
    const key = 'ytm:synced-lyrics:mxm:token';

    const { token, expires } = JSON.parse(localStorage.getItem(key) ?? '{ "token": null }') as any;
    if (token && expires > Date.now()) {
      this.token = token;
      return;
    }

    localStorage.removeItem(key);

    this.token = await this.getToken();
    if (!this.token) throw new Error('Failed to get token');

    localStorage.setItem(key, JSON.stringify({ token: this.token, expires: Date.now() + (3600 * 1000) }));
  }

  private async getToken() {
    const endpoint = 'token.get';
    const params = new URLSearchParams({ app_id: this.app_id });
    const [_, json, headers] = await netFetch(`${this.baseUrl}${endpoint}?${params}`, {
      headers: Object.assign({"Cookie": this.cookie}, this.headers)
    });

    const setCookie = Object.entries(headers).find(([key]) => key.toLowerCase() === 'set-cookie');
    if (setCookie) {
      this.cookie = setCookie[1];
    }

    const { user_token } = (JSON.parse(json) as any)?.message?.body ?? {};
    return user_token;
  }

  private readonly baseUrl = 'https://apic-desktop.musixmatch.com/ws/1.1/';
  private readonly app_id = 'web-desktop-app-v1.0';
  private readonly headers = {
    // prettier-ignore
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'authority': "apic-desktop.musixmatch.com",
  };
}
