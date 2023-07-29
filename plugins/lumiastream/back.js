const fetch = require("node-fetch");

const registerCallback = require("../../providers/song-info");

const secToMilisec = (t) => Math.round(Number(t) * 1e3);
const previousStatePaused = null;
const data = {
	origin: "youtubemusic",
	eventType: "switchSong",
	url: "",
	videoId: "",
	playlistId: "",
	cover: "",
	cover_url: "",
	title: "",
	artists: [],
	status: "",
	progress: 0,
	duration: 0,
	album_url: "",
	album: undefined,
	views: "",
};

const post = async (data) => {
	const port = 39231;
	headers = {
		"Content-Type": "application/json",
		Accept: "application/json",
		"Access-Control-Allow-Headers": "*",
		"Access-Control-Allow-Origin": "*",
	};
	const url = `http://localhost:${port}/api/media`;
	fetch(url, {
		method: "POST",
		headers,
		body: JSON.stringify({ token: "lsmedia_ytmsI7812", data }),
	}).catch((e) =>
		console.log(
			`Error: '${
				e.code || e.errno
			}' - when trying to access lumiastream webserver at port ${port}`
		)
	);
};

/** @param {Electron.BrowserWindow} win */
module.exports = async (win) => {
	registerCallback((songInfo) => {
		if (!songInfo.title && !songInfo.artist) {
			return;
		}

		if (previousStatePaused === null) {
			data.eventType = "switchSong";
		} else if (previousStatePaused !== songInfo.isPaused) {
			data.eventType = "playPause";
		}

		data.duration = secToMilisec(songInfo.songDuration);
		data.progress = secToMilisec(songInfo.elapsedSeconds);
		data.url = songInfo.url;
		data.videoId = songInfo.videoId;
		data.playlistId = songInfo.playlistId;
		data.cover = songInfo.imageSrc;
		data.cover_url = songInfo.imageSrc;
		data.album_url = songInfo.imageSrc;
		data.title = songInfo.title;
		data.artists = [songInfo.artist];
		data.status = songInfo.isPaused ? "stopped" : "playing";
		data.isPaused = songInfo.isPaused;
		data.album = songInfo.album;
		data.views = songInfo.views;
		post(data);
	});
};
