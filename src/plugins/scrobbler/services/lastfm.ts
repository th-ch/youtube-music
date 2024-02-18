import crypto from 'node:crypto';

import { net, shell } from 'electron';

import { ScrobblerBase } from './base';

import { ScrobblerPluginConfig } from '../index';
import { SetConfType } from '../main';

import type { SongInfo } from '@/providers/song-info';

interface LastFmData {
  method: string;
  timestamp?: number;
}

interface LastFmSongData {
  track?: string;
  duration?: number;
  artist?: string;
  album?: string;
  api_key: string;
  sk?: string;
  format: string;
  method: string;
  timestamp?: number;
  api_sig?: string;
}

export class LastFmScrobbler extends ScrobblerBase {
  isSessionCreated(config: ScrobblerPluginConfig): boolean {
    return !!config.scrobblers.lastfm.sessionKey;
  }

  async createSession(config: ScrobblerPluginConfig, setConfig: SetConfType): Promise<ScrobblerPluginConfig> {
    // Get and store the session key
    const data = {
      api_key: config.scrobblers.lastfm.apiKey,
      format: 'json',
      method: 'auth.getsession',
      token: config.scrobblers.lastfm.token,
    };
    const apiSignature = createApiSig(data, config.scrobblers.lastfm.secret);
    const response = await net.fetch(
      `${config.scrobblers.lastfm.apiRoot}${createQueryString(data, apiSignature)}`,
    );
    const json = (await response.json()) as {
      error?: string;
      session?: {
        key: string;
      };
    };
    if (json.error) {
      config.scrobblers.lastfm.token = await createToken(config);
      await authenticate(config);
      setConfig(config);
    }
    if (json.session) {
      config.scrobblers.lastfm.sessionKey = json.session.key;
    }
    setConfig(config);
    return config;
  }

  setNowPlaying(songInfo: SongInfo, config: ScrobblerPluginConfig, setConfig: SetConfType): void {
    if (!config.scrobblers.lastfm.sessionKey) {
      return;
    }

    // This sets the now playing status in last.fm
    const data = {
      method: 'track.updateNowPlaying',
    };
    this.postSongDataToAPI(songInfo, config, data, setConfig);
  }

  addScrobble(songInfo: SongInfo, config: ScrobblerPluginConfig, setConfig: SetConfType): void {
    if (!config.scrobblers.lastfm.sessionKey) {
      return;
    }

    // This adds one scrobbled song to last.fm
    const data = {
      method: 'track.scrobble',
      timestamp: Math.trunc((Date.now() - (songInfo.elapsedSeconds ?? 0)) / 1000),
    };
    this.postSongDataToAPI(songInfo, config, data, setConfig);
  }

  async postSongDataToAPI(
    songInfo: SongInfo,
    config: ScrobblerPluginConfig,
    data: LastFmData,
    setConfig: SetConfType,
  ): Promise<void> {
    // This sends a post request to the api, and adds the common data
    if (!config.scrobblers.lastfm.sessionKey) {
      await this.createSession(config, setConfig);
    }

    const postData: LastFmSongData = {
      track: songInfo.title,
      duration: songInfo.songDuration,
      artist: songInfo.artist,
      ...(songInfo.album ? { album: songInfo.album } : undefined), // Will be undefined if current song is a video
      api_key: config.scrobblers.lastfm.apiKey,
      sk: config.scrobblers.lastfm.sessionKey,
      format: 'json',
      ...data,
    };

    postData.api_sig = createApiSig(postData, config.scrobblers.lastfm.secret);
    const formData = createFormData(postData);
    net
      .fetch('https://ws.audioscrobbler.com/2.0/', {
        method: 'POST',
        body: formData,
      })
      .catch(
        async (error: {
          response?: {
            data?: {
              error: number;
            };
          };
        }) => {
          if (error?.response?.data?.error === 9) {
            // Session key is invalid, so remove it from the config and reauthenticate
            config.scrobblers.lastfm.sessionKey = undefined;
            config.scrobblers.lastfm.token = await createToken(config);
            await authenticate(config);
            setConfig(config);
          } else {
            console.error(error);
          }
        },
      );
  }
}

const createFormData = (parameters: LastFmSongData) => {
  // Creates the body for in the post request
  const formData = new URLSearchParams();
  for (const key in parameters) {
    formData.append(key, String(parameters[key as keyof LastFmSongData]));
  }

  return formData;
};

const createQueryString = (
  parameters: Record<string, unknown>,
  apiSignature: string,
) => {
  // Creates a querystring
  const queryData = [];
  parameters.api_sig = apiSignature;
  for (const key in parameters) {
    queryData.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(
        String(parameters[key]),
      )}`,
    );
  }

  return '?' + queryData.join('&');
};

const createApiSig = (parameters: LastFmSongData, secret: string) => {
  // This function creates the api signature, see: https://www.last.fm/api/authspec
  const keys = Object.keys(parameters);

  keys.sort();
  let sig = '';
  for (const key of keys) {
    if (key === 'format') {
      continue;
    }

    sig += `${key}${parameters[key as keyof LastFmSongData]}`;
  }

  sig += secret;
  sig = crypto.createHash('md5').update(sig, 'utf-8').digest('hex');
  return sig;
};

const createToken = async ({
  scrobblers: {
    lastfm: {
      apiKey,
      apiRoot,
      secret,
    }
  }
}: ScrobblerPluginConfig) => {
  // Creates and stores the auth token
  const data = {
    method: 'auth.gettoken',
    api_key: apiKey,
    format: 'json',
  };
  const apiSigature = createApiSig(data, secret);
  const response = await net.fetch(
    `${apiRoot}${createQueryString(data, apiSigature)}`,
  );
  const json = (await response.json()) as Record<string, string>;
  return json?.token;
};

const authenticate = async (config: ScrobblerPluginConfig) => {
  // Asks the user for authentication
  await shell.openExternal(
    `https://www.last.fm/api/auth/?api_key=${config.scrobblers.lastfm.apiKey}&token=${config.scrobblers.lastfm.token}`,
  );
};
