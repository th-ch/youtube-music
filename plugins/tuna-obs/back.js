const { ipcMain } = require("electron");
const fetch = require('node-fetch');

const registerCallback = require("../../providers/song-info");

const secToMilisec = t => Math.round(Number(t) * 1e3);
const data = {
	cover: '',
	cover_url: '',
	title: '',
	artists: [],
	status: '',
	progress: 0,
	duration: 0,
	album_url: '',
	album: undefined
};

const post = async (data) => {
	const port = 1608;
	headers = {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		'Access-Control-Allow-Headers': '*',
		'Access-Control-Allow-Origin': '*'
	}
	const url = `http://localhost:${port}/`;
	fetch(url, { method: 'POST', headers, body: JSON.stringify({ data }) }).catch(e => console.log(`Error: '${e.code || e.errno}' - when trying to access obs-tuna webserver at port ${port}`));
}

/** @param {Electron.BrowserWindow} win */
module.exports = async (win) => {
	ipcMain.on('apiLoaded', () => win.webContents.send('setupTimeChangedListener'));
	ipcMain.on('timeChanged', async (_, t) => {
		if (!data.title) return;
		data.progress = secToMilisec(t);
		post(data);
	});

	registerCallback((songInfo) => {
		if (!songInfo.title && !songInfo.artist) {
			return;
		}

		data.duration = secToMilisec(songInfo.songDuration)
		data.progress = secToMilisec(songInfo.elapsedSeconds)
		data.cover = songInfo.imageSrc;
		data.cover_url = songInfo.imageSrc;
		data.album_url = songInfo.imageSrc;
		data.title = songInfo.title;
		data.artists = [songInfo.artist];
		data.status = songInfo.isPaused ? 'stopped' : 'playing';
		data.album = songInfo.album;
		post(data);
	})
}
