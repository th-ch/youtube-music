const fetch = require('node-fetch');
const md5 = require('md5');
const open = require("open");
const axios = require('axios');
const { setOptions } = require('../../config/plugins');
const getSongInfo = require('../../providers/song-info');

const createFormData = (params) => {
	// creates the body for in the post request
	let formData = new URLSearchParams();
	for (key in params) {
		formData.append(key, params[key]);
	}
	return formData;
}
const createQueryString = (params, api_sig) => {
	// creates a querystring
	const queryData = []
	params.api_sig = api_sig
	for (key in params) {
		queryData.push(`${key}=${params[key]}`)
	}
	return '?'+queryData.join('&')
}

const createApiSig = (params, secret) => { 
	// this function creates the api signature, see: https://www.last.fm/api/authspec
	let keys = [];
	for (key in params){
		keys.push(key);
	}
	keys.sort();
	let sig = '';
	for (key of keys) {
		if (String(key) === 'format')
			continue
		sig += `${key}${params[key]}`
	}
	sig += secret
	sig = md5(sig)
	return sig
}

const createToken = async ({api_key, api_root, secret}) => {
	// creates an auth token
	data = {
		method: 'auth.gettoken',
		api_key: api_key,
		format: 'json'
	}
	let api_sig = createApiSig(data, secret);
	let response = await fetch(`${api_root}${createQueryString(data, api_sig)}`);
	response = await response.json();
	return response?.token;
}

const authenticate = async (config) => {
	// asks user for authentication
	config.token = await createToken(config);
	setOptions('last-fm', config);
	open(`https://www.last.fm/api/auth/?api_key=${config.api_key}&token=${config.token}`);
	return config
}

const getAndSetSessionKey = async (config) => {
	// get and set the session key
	data = {
		api_key: config.api_key,
		format: 'json',
		method: 'auth.getsession',
		token: config.token,
	}
	api_sig = createApiSig(data, config.secret);
	res = await fetch(`${config.api_root}${createQueryString(data, api_sig)}`);
	res = await res.json();
	if (res.error)
		await authenticate(config);
	config.session_key = res?.session?.key;
	setOptions('last-fm', config);
	return config
}


const addScrobble = async (songInfo, config) => {
	// this adds one scrobbled song
	if (!config.session_key)
		await getAndSetSessionKey(config);
	data = {
		track: songInfo.title,
		artist: songInfo.artist,
		api_key: config.api_key,
		sk: config.session_key,
		format: 'json',
		method: 'track.scrobble',
		timestamp: ~~((Date.now() - songInfo.elapsedSeconds)/1000),
		duration: songInfo.songDuration,
	}
	data.api_sig = createApiSig(data, config.secret)
	axios.post('https://ws.audioscrobbler.com/2.0/', createFormData(data))
		.then(res => res.data.scrobbles)
		.catch(res => {
			if (res.response.data.error == 9){
				// session key is invalid
				config.session_key = undefined;
				setOptions('last-fm', config);
				authenticate(config);
			}
		});
}

// this will store the timeout that will trigger addScrobble
let scrobbleTimer = undefined;

const lastfm = async (win, config) => {
	const registerCallback = getSongInfo(win);
	
	if (!config.session_key) {
		// not authenticated
		config = await getAndSetSessionKey(config);
	}

	registerCallback((songInfo)=> {
		clearTimeout(scrobbleTimer);
		if (!songInfo.isPaused) {
			let scrobbleTime = Math.min(Math.ceil(songInfo.songDuration/2), 4*60);
			if (scrobbleTime > songInfo.elapsedSeconds) {
				// scrobble still needs to happen
				timeToWait = (scrobbleTime-songInfo.elapsedSeconds)*1000;
				scrobbleTimer = setTimeout(addScrobble, timeToWait, songInfo, config);
			}
		}
	})
}

module.exports = lastfm;