const { ipcMain } = require("electron");
const fetch = require('node-fetch');

const registerCallback = require("../../providers/song-info");

const post = async (data) => {
	const port = 1608;
	headers = {'Content-Type': 'application/json',
		'Accept': 'application/json',
		'Access-Control-Allow-Headers': '*',
		'Access-Control-Allow-Origin': '*'}
	const url = `http://localhost:${port}/`;
	await fetch(url, {method: 'POST', headers, body:JSON.stringify({data})});
}

module.exports = async (win) => {
	registerCallback(async (songInfo) => {
			
			if (songInfo.title?.length === 0 && songInfo.artist?.length === 0) {
				return;
			}

			const duration = Number(songInfo.songDuration) * 1000
			const progress = Number(songInfo.elapsedSeconds) * 1000
			const cover_url = songInfo.imageSrc
			const album_url = songInfo.imageSrc
			const title = songInfo.title
			const artists = [songInfo.artist]
			const status = !songInfo.isPaused ? 'Playing' : 'Paused'
			await post({cover_url, title, artists, status, progress, duration, album_url});
		})
}
