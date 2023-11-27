import crypto from 'node:crypto';

import { net, shell } from 'electron';

import type { LastFmPluginConfig } from './index';
import type { SongInfo } from '@/providers/song-info';

interface LastFmData {
  method: string,
  timestamp?: number,
}

interface LastFmSongData {
  track?: string,
  duration?: number,
  artist?: string,
  album?: string,
  api_key: string,
  sk?: string,
  format: string,
  method: string,
  timestamp?: number,
  api_sig?: string,
}

const createFormData = (parameters: LastFmSongData) => {
  // Creates the body for in the post request
  const formData = new URLSearchParams();
  for (const key in parameters) {
    formData.append(key, String(parameters[key as keyof LastFmSongData]));
  }

  return formData;
};

const createQueryString = (parameters: Record<string, unknown>, apiSignature: string) => {
  // Creates a querystring
  const queryData = [];
  parameters.api_sig = apiSignature;
  for (const key in parameters) {
    queryData.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(parameters[key]))}`);
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

const createToken = async ({ api_key: apiKey, api_root: apiRoot, secret }: LastFmPluginConfig) => {
  // Creates and stores the auth token
  const data = {
    method: 'auth.gettoken',
    api_key: apiKey,
    format: 'json',
  };
  const apiSigature = createApiSig(data, secret);
  const response = await net.fetch(`${apiRoot}${createQueryString(data, apiSigature)}`);
  const json = await response.json() as Record<string, string>;
  return json?.token;
};

const authenticate = async (config: LastFmPluginConfig) => {
  // Asks the user for authentication
  await shell.openExternal(`https://www.last.fm/api/auth/?api_key=${config.api_key}&token=${config.token}`);
};

type SetConfType = (conf: Partial<Omit<LastFmPluginConfig, 'enabled'>>) => (void | Promise<void>);

export const getAndSetSessionKey = async (config: LastFmPluginConfig, setConfig: SetConfType) => {
  // Get and store the session key
  const data = {
    api_key: config.api_key,
    format: 'json',
    method: 'auth.getsession',
    token: config.token,
  };
  const apiSignature = createApiSig(data, config.secret);
  const response = await net.fetch(`${config.api_root}${createQueryString(data, apiSignature)}`);
  const json = await response.json() as {
    error?: string,
    session?: {
      key: string,
    }
  };
  if (json.error) {
    config.token = await createToken(config);
    await authenticate(config);
    setConfig(config);
  }
  if (json.session) {
    config.session_key = json.session.key;
  }
  setConfig(config);
  return config;
};

const postSongDataToAPI = async (songInfo: SongInfo, config: LastFmPluginConfig, data: LastFmData, setConfig: SetConfType) => {
  // This sends a post request to the api, and adds the common data
  if (!config.session_key) {
    await getAndSetSessionKey(config, setConfig);
  }

  const postData: LastFmSongData = {
    track: songInfo.title,
    duration: songInfo.songDuration,
    artist: songInfo.artist,
    ...(songInfo.album ? { album: songInfo.album } : undefined), // Will be undefined if current song is a video
    api_key: config.api_key,
    sk: config.session_key,
    format: 'json',
    ...data,
  };

  postData.api_sig = createApiSig(postData, config.secret);
  const formData = createFormData(postData);
  net.fetch('https://ws.audioscrobbler.com/2.0/', { method: 'POST', body: formData })
    .catch(async (error: {
      response?: {
        data?: {
          error: number,
        }
      }
    }) => {
      if (error?.response?.data?.error === 9) {
        // Session key is invalid, so remove it from the config and reauthenticate
        config.session_key = undefined;
        config.token = await createToken(config);
        await authenticate(config);
        setConfig(config);
      }
    });
};

export const addScrobble = (songInfo: SongInfo, config: LastFmPluginConfig, setConfig: SetConfType) => {
  // This adds one scrobbled song to last.fm
  const data = {
    method: 'track.scrobble',
    timestamp: Math.trunc((Date.now() - (songInfo.elapsedSeconds ?? 0)) / 1000),
  };
  postSongDataToAPI(songInfo, config, data, setConfig);
};

export const setNowPlaying = (songInfo: SongInfo, config: LastFmPluginConfig, setConfig: SetConfType) => {
  // This sets the now playing status in last.fm
  const data = {
    method: 'track.updateNowPlaying',
  };
  postSongDataToAPI(songInfo, config, data, setConfig);
};
