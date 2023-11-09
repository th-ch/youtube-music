import crypto from 'node:crypto';

import { BrowserWindow, net, shell } from 'electron';

import { setOptions } from '../../config/plugins';
import registerCallback, { SongInfo } from '../../providers/song-info';
import defaultConfig from '../../config/defaults';

import type { ConfigType } from '../../config/dynamic';

type LastFMOptions = ConfigType<'last-fm'>;

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
    if (String(key) === 'format') {
      continue;
    }

    sig += `${key}${parameters[key as keyof LastFmSongData]}`;
  }

  sig += secret;
  sig = crypto.createHash('md5').update(sig, 'utf-8').digest('hex');
  return sig;
};

const createToken = async ({ api_key: apiKey, api_root: apiRoot, secret }: LastFMOptions) => {
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

const authenticate = async (config: LastFMOptions) => {
  // Asks the user for authentication
  await shell.openExternal(`https://www.last.fm/api/auth/?api_key=${config.api_key}&token=${config.token}`);
};

const getAndSetSessionKey = async (config: LastFMOptions) => {
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
    setOptions('last-fm', config);
  }
  if (json.session) {
    config.session_key = json.session.key;
  }
  setOptions('last-fm', config);
  return config;
};

const postSongDataToAPI = async (songInfo: SongInfo, config: LastFMOptions, data: LastFmData) => {
  // This sends a post request to the api, and adds the common data
  if (!config.session_key) {
    await getAndSetSessionKey(config);
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
        setOptions('last-fm', config);
      }
    });
};

const addScrobble = (songInfo: SongInfo, config: LastFMOptions) => {
  // This adds one scrobbled song to last.fm
  const data = {
    method: 'track.scrobble',
    timestamp: Math.trunc((Date.now() - (songInfo.elapsedSeconds ?? 0)) / 1000),
  };
  postSongDataToAPI(songInfo, config, data);
};

const setNowPlaying = (songInfo: SongInfo, config: LastFMOptions) => {
  // This sets the now playing status in last.fm
  const data = {
    method: 'track.updateNowPlaying',
  };
  postSongDataToAPI(songInfo, config, data);
};

// This will store the timeout that will trigger addScrobble
let scrobbleTimer: NodeJS.Timeout | undefined;

const lastfm = async (_win: BrowserWindow, config: LastFMOptions) => {
  if (!config.api_root) {
    // Settings are not present, creating them with the default values
    config = defaultConfig.plugins['last-fm'];
    config.enabled = true;
    setOptions('last-fm', config);
  }

  if (!config.session_key) {
    // Not authenticated
    config = await getAndSetSessionKey(config);
  }

  registerCallback((songInfo) => {
    // Set remove the old scrobble timer
    clearTimeout(scrobbleTimer);
    if (!songInfo.isPaused) {
      setNowPlaying(songInfo, config);
      // Scrobble when the song is halfway through, or has passed the 4-minute mark
      const scrobbleTime = Math.min(Math.ceil(songInfo.songDuration / 2), 4 * 60);
      if (scrobbleTime > (songInfo.elapsedSeconds ?? 0)) {
        // Scrobble still needs to happen
        const timeToWait = (scrobbleTime - (songInfo.elapsedSeconds ?? 0)) * 1000;
        scrobbleTimer = setTimeout(addScrobble, timeToWait, songInfo, config);
      }
    }
  });
};

export default lastfm;
