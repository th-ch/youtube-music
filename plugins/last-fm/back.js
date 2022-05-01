const fetch = require('node-fetch');
const md5 = require('md5');
const { shell } = require('electron');
const { setOptions } = require('../../config/plugins');
const registerCallback = require('../../providers/song-info');
const defaultConfig = require('../../config/defaults');

const createFormData = params => {
	// creates the body for in the post request
	const formData = new URLSearchParams();
	for (const key in params) {
		formData.append(key, params[key]);
	}
	return formData;
}
const createQueryString = (params, api_sig) => {
	// creates a querystring
	const queryData = [];
	params.api_sig = api_sig;
	for (const key in params) {
		queryData.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
	}
	return '?'+queryData.join('&');
}

const createApiSig = (params, secret) => { 
	// this function creates the api signature, see: https://www.last.fm/api/authspec
	const keys = [];
	for (const key in params) {
		keys.push(key);
	}
	keys.sort();
	let sig = '';
	for (const key of keys) {
		if (String(key) === 'format')
			continue
		sig += `${key}${params[key]}`;
	}
	sig += secret;
	sig = md5(sig);
	return sig;
}

const createToken = async ({ api_key, api_root, secret }) => {
	// creates and stores the auth token
	const data = {
		method: 'auth.gettoken',
		api_key: api_key,
		format: 'json'
	};
	const api_sig = createApiSig(data, secret);
	let response = await fetch(`${api_root}${createQueryString(data, api_sig)}`);
	response = await response.json();
	return response?.token;
}

const authenticate = async config => {
	// asks the user for authentication
	config.token = await createToken(config);
	setOptions('last-fm', config);
	shell.openExternal(`https://www.last.fm/api/auth/?api_key=${config.api_key}&token=${config.token}`);
	return config;
}

const getAndSetSessionKey = async config => {
	// get and store the session key
	const data = {
		api_key: config.api_key,
		format: 'json',
		method: 'auth.getsession',
		token: config.token,
	};
	const api_sig = createApiSig(data, config.secret);
	let res = await fetch(`${config.api_root}${createQueryString(data, api_sig)}`);
	res = await res.json();
	if (res.error)
		await authenticate(config);
	config.session_key = res?.session?.key;
	setOptions('last-fm', config);
	return config;
}

const postSongDataToAPI = async (songInfo, config, data) => {
	// this sends a post request to the api, and adds the common data
	if (!config.session_key)
		await getAndSetSessionKey(config);

	const postData = {
		track: songInfo.title,
		duration: songInfo.songDuration,
		artist: songInfo.artist,
		...(songInfo.album ? { album: songInfo.album } : undefined), // will be undefined if current song is a video
		api_key: config.api_key,
		sk: config.session_key,
		format: 'json',
		...data,
	};

	postData.api_sig = createApiSig(postData, config.secret);
	fetch('https://ws.audioscrobbler.com/2.0/', {method: 'POST', body: createFormData(postData)})
		.catch(res => {
			if (res.response.data.error == 9) {
				// session key is invalid, so remove it from the config and reauthenticate
				config.session_key = undefined;
				setOptions('last-fm', config);
				authenticate(config);
			}
		});
}

const addScrobble = (songInfo, config) => {
	// this adds one scrobbled song to last.fm
	const data = {
		method: 'track.scrobble',
		timestamp: ~~((Date.now() - songInfo.elapsedSeconds) / 1000),
	};
	postSongDataToAPI(songInfo, config, data);
}

const setNowPlaying = (songInfo, config) => {
	// this sets the now playing status in last.fm
	const data = {
		method: 'track.updateNowPlaying',
	};
	postSongDataToAPI(songInfo, config, data);
}


// this will store the timeout that will trigger addScrobble
let scrobbleTimer = undefined;

const lastfm = async (_win, config) => {
	if (!config.api_root) {
		// settings are not present, creating them with the default values
		config = defaultConfig.plugins['last-fm'];
		config.enabled = true;
		setOptions('last-fm', config);
	}

	if (!config.session_key) {
		// not authenticated
		config = await getAndSetSessionKey(config);
	}

	registerCallback( songInfo => {
		// set remove the old scrobble timer
		clearTimeout(scrobbleTimer);
		if (!songInfo.isPaused) {
			setNowPlaying(songInfo, config);
			// scrobble when the song is half way through, or has passed the 4 minute mark
			const scrobbleTime = Math.min(Math.ceil(songInfo.songDuration / 2), 4 * 60);
			if (scrobbleTime > songInfo.elapsedSeconds) {
				// scrobble still needs to happen
				const timeToWait = (scrobbleTime - songInfo.elapsedSeconds) * 1000;
				scrobbleTimer = setTimeout(addScrobble, timeToWait, songInfo, config);
			}
		}
	});
}

module.exports = lastfm;
