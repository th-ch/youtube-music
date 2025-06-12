import { z } from 'zod';

import { LRC } from '../parsers/lrc';
import { netFetch } from '../renderer';
import type { LyricProvider, LyricResult, SearchSongInfo } from '../types';

export class MusixMatch implements LyricProvider {
  name = 'MusixMatch';
  baseUrl = 'https://www.musixmatch.com/';

  private api: MusixMatchAPI | undefined;

  async search(info: SearchSongInfo): Promise<LyricResult | null> {
    // late-init the API, to avoid an electron IPC issue
    // an added benefit is that if it has an error during init, the user can hit the retry button
    this.api ??= await MusixMatchAPI.new();

    const data = await this.api.query(Endpoint.getMacroSubtitles, {
      q_track: info.alternativeTitle || info.title,
      q_artist: info.artist,
      q_duration: info.songDuration.toString(),
      ...(info.album ? { q_album: info.album } : {}),
      namespace: 'lyrics_richsynched',
      subtitle_format: 'lrc',
    });

    const { macro_calls } = data.body;

    // prettier-ignore
    const getter = <T extends keyof typeof macro_calls>(key: T): typeof macro_calls[T]['message']['body'] => macro_calls[key].message.body;

    const track = getter('matcher.track.get')?.track;
    const lyrics = getter('track.lyrics.get')?.lyrics?.lyrics_body;
    const subtitle = getter('track.subtitles.get')?.subtitle_list?.[0];

    if (!track) return null;

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

const zBoolean = z.union([z.literal(0), z.literal(1)]);
const Track = z.object({
  track_id: z.number(),
  track_name: z.string(),
  artist_name: z.string(),
});

const Lyrics = z.object({
  instrumental: zBoolean,
  lyrics_body: z.string(),
  lyrics_language: z.string(),
  lyrics_language_description: z.string(),
});

const Subtitle = z.object({
  subtitle_body: z.string(),
  subtitle_length: z.number(),
  subtitle_language: z.string(),
});

enum Endpoint {
  getMacroSubtitles = 'macro.subtitles.get',
  searchTrack = 'track.search',
}

type Query = {
  q?: string;
  q_track?: string;
  q_artist?: string;
  q_album?: string;
  q_duration?: string;
};

type Params = {
  [Endpoint.getMacroSubtitles]: Query & {
    namespace: 'lyrics_richsynched';
    subtitle_format: 'lrc';
  };
  [Endpoint.searchTrack]: {
    q: string;
    f_has_lyrics: 'true' | 'false';
    page_size: string;
    page: string;
  };
};

const ResponseSchema = {
  [Endpoint.searchTrack]: z.object({
    track_list: z.array(z.object({ track: Track })),
  }),
  [Endpoint.getMacroSubtitles]: z.object({
    macro_calls: z.object({
      'track.lyrics.get': z.object({
        message: z.object({ body: z.object({ lyrics: Lyrics }) }),
      }),
      'track.subtitles.get': z.object({
        message: z.object({
          body: z.object({
            subtitle_list: z.array(z.object({ subtitle: Subtitle })),
          }),
        }),
      }),
      'matcher.track.get': z.object({
        message: z.object({ body: z.object({ track: Track }) }),
      }),
    }),
  }),
} as const;

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
  public async query<
    T extends Endpoint,
    R = {
      header: { status_code: number };
      body: T extends keyof typeof ResponseSchema
        ? z.infer<(typeof ResponseSchema)[T]>
        : unknown;
    }
  >(endpoint: T, params: Params[T]): Promise<R> {
    await this.initPromise;
    if (!this.token) throw new Error('Token not initialized');

    const url = `${this.baseUrl}${endpoint}`;

    const clonedParams = new URLSearchParams(
      Object.assign(
        {
          app_id: this.app_id,
          format: 'json',
          usertoken: this.token,
        },
        <Record<string, string>>params
      )
    );

    const [_, json, headers] = await netFetch(`${url}?${clonedParams}`, {
      headers: { Cookie: this.cookie },
    });

    const setCookie = Object.entries(headers).find(
      ([key]) => key.toLowerCase() === 'set-cookie'
    );
    if (setCookie) {
      this.cookie = setCookie[1];
    }

    const response = JSON.parse(json);
    const parsed = await z
      .object({
        message: z.object({ body: ResponseSchema[endpoint] }),
      })
      .parseAsync(response);

    // @ts-expect-error weird union type issue
    return parsed.message;
  }

  private savedTokenSchema = z.union([
    z.object({
      token: z.literal(null),
      expires: z.number().optional(),
    }),
    z.object({
      token: z.string(),
      expires: z.number(),
    }),
  ]);

  private async init() {
    const key = 'ytm:synced-lyrics:mxm:token';

    const { token, expires } = this.savedTokenSchema.parse(
      JSON.parse(localStorage.getItem(key) ?? '{ "token": null }')
    );
    if (token && expires > Date.now()) {
      this.token = token;
      return;
    }

    localStorage.removeItem(key);

    this.token = await this.getToken();
    if (!this.token) throw new Error('Failed to get token');

    localStorage.setItem(
      key,
      JSON.stringify({ token: this.token, expires: Date.now() + 3600 * 1000 })
    );
  }

  private tokenSchema = z.object({
    message: z.object({
      body: z.object({
        user_token: z.string(),
      }),
    }),
  });
  private async getToken() {
    const endpoint = 'token.get';
    const params = new URLSearchParams({ app_id: this.app_id });
    const [_, json, headers] = await netFetch(
      `${this.baseUrl}${endpoint}?${params}`,
      {
        headers: Object.assign({ Cookie: this.cookie }, this.headers),
      }
    );

    const setCookie = Object.entries(headers).find(
      ([key]) => key.toLowerCase() === 'set-cookie'
    );
    if (setCookie) {
      this.cookie = setCookie[1];
    }

    const {
      message: {
        body: { user_token },
      },
    } = this.tokenSchema.parse(JSON.parse(json));
    return user_token;
  }

  private readonly baseUrl = 'https://apic-desktop.musixmatch.com/ws/1.1/';
  private readonly app_id = 'web-desktop-app-v1.0';
  private readonly headers = {
    // prettier-ignore
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'authority': 'apic-desktop.musixmatch.com',
  };
}
