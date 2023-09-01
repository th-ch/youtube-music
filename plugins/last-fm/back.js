const { shell, net } = require('electron');
const md5 = require('md5');

const { setOptions } = require('../../config/plugins');
const registerCallback = require('../../providers/song-info');
const defaultConfig = require('../../config/defaults');

const createFormData = (parameters) => {
  // Creates the body for in the post request
  const formData = new URLSearchParams();
  for (const key in parameters) {
    formData.append(key, parameters[key]);
  }

  return formData;
};

const createQueryString = (parameters, apiSignature) => {
  // Creates a querystring
  const queryData = [];
  parameters.api_sig = apiSignature;
  for (const key in parameters) {
    queryData.push(`${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`);
  }

  return '?' + queryData.join('&');
};

const createApiSig = (parameters, secret) => {
  // This function creates the api signature, see: https://www.last.fm/api/authspec
  const keys = [];
  for (const key in parameters) {
    keys.push(key);
  }

  keys.sort();
  let sig = '';
  for (const key of keys) {
    if (String(key) === 'format') {
      continue;
    }

    sig += `${key}${parameters[key]}`;
  }

  sig += secret;
  sig = md5(sig);
  return sig;
};

const createToken = async ({ apiKey, apiRoot, secret }) => {
  // Creates and stores the auth token
  const data = {
    method: 'auth.gettoken',
    apiKey,
    format: 'json',
  };
  const apiSigature = createApiSig(data, secret);
  let response = await net.fetch(`${apiRoot}${createQueryString(data, apiSigature)}`);
  response = await response.json();
  return response?.token;
};

const authenticate = async (config) => {
  // Asks the user for authentication
  config.token = await createToken(config);
  setOptions('last-fm', config);
  shell.openExternal(`https://www.last.fm/api/auth/?api_key=${config.api_key}&token=${config.token}`);
  return config;
};

const getAndSetSessionKey = async (config) => {
  // Get and store the session key
  const data = {
    api_key: config.api_key,
    format: 'json',
    method: 'auth.getsession',
    token: config.token,
  };
  const apiSignature = createApiSig(data, config.secret);
  let res = await net.fetch(`${config.api_root}${createQueryString(data, apiSignature)}`);
  res = await res.json();
  if (res.error) {
    await authenticate(config);
  }

  config.session_key = res?.session?.key;
  setOptions('last-fm', config);
  return config;
};

const postSongDataToAPI = async (songInfo, config, data) => {
  // This sends a post request to the api, and adds the common data
  if (!config.session_key) {
    await getAndSetSessionKey(config);
  }

  const postData = {
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
  net.fetch('https://ws.audioscrobbler.com/2.0/', { method: 'POST', body: createFormData(postData) })
    .catch((error) => {
      if (error.response.data.error === 9) {
        // Session key is invalid, so remove it from the config and reauthenticate
        config.session_key = undefined;
        setOptions('last-fm', config);
        authenticate(config);
      }
    });
};

const addScrobble = (songInfo, config) => {
  // This adds one scrobbled song to last.fm
  const data = {
    method: 'track.scrobble',
    timestamp: Math.trunc((Date.now() - songInfo.elapsedSeconds) / 1000),
  };
  postSongDataToAPI(songInfo, config, data);
};

const setNowPlaying = (songInfo, config) => {
  // This sets the now playing status in last.fm
  const data = {
    method: 'track.updateNowPlaying',
  };
  postSongDataToAPI(songInfo, config, data);
};

// This will store the timeout that will trigger addScrobble
let scrobbleTimer;

const lastfm = async (_win, config) => {
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
      // Scrobble when the song is half way through, or has passed the 4 minute mark
      const scrobbleTime = Math.min(Math.ceil(songInfo.songDuration / 2), 4 * 60);
      if (scrobbleTime > songInfo.elapsedSeconds) {
        // Scrobble still needs to happen
        const timeToWait = (scrobbleTime - songInfo.elapsedSeconds) * 1000;
        scrobbleTimer = setTimeout(addScrobble, timeToWait, songInfo, config);
      }
    }
  });
};

module.exports = lastfm;
